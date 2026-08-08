import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { AddOpportunityForm } from "./components/AddOpportunityForm";
import { BulkAddOpportunities } from "./components/BulkAddOpportunities";
import { OpportunityList, type SyncKind } from "./components/OpportunityList";
import { hasCalendarAccessThisSession, signInWithGoogle, signOut } from "./lib/auth";
import { storeCalendarToken } from "./lib/storeCalendarToken";
import { supabase } from "./lib/supabaseClient";
import type { Opportunity, OpportunityStatus } from "./models/opportunity";
import { CalendarService } from "./services/calendarService";
import { GoogleCalendarClient } from "./services/calendarClient.google";
import { SupabaseOpportunityRepository } from "./services/opportunityRepository.supabase";
import { OpportunityStore } from "./services/opportunityStore";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [syncingKey, setSyncingKey] = useState<string | null>(null);

  const store = useMemo(() => new OpportunityStore(new SupabaseOpportunityRepository(supabase)), []);
  const calendarService = useMemo(() => new CalendarService(new GoogleCalendarClient()), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      // provider_refresh_token is only ever present in the session object at this exact
      // moment (right after the OAuth callback) — Supabase never persists it. Capture and
      // store it server-side now, since this is the only chance to do so.
      if (hasCalendarAccessThisSession(newSession)) {
        storeCalendarToken(newSession!.provider_refresh_token!)
          .then(() => setCalendarConnected(true))
          .catch((err) => {
            setCalendarConnected(false);
            setError(
              `Failed to save calendar access: ${err instanceof Error ? err.message : "unknown error"}. Sign out and back in to retry.`,
            );
          });
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setOpportunities([]);
      return;
    }
    store
      .load()
      .then(setOpportunities)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load opportunities."));
  }, [session, store]);

  const handleAdd = async (input: Parameters<typeof store.add>[0]) => {
    setError(null);
    await store.add(input);
    setOpportunities(store.all);
  };

  const handleStatusChange = async (id: string, status: OpportunityStatus) => {
    setError(null);
    try {
      // store.all, not the opportunities state var — this must be the freshest known
      // deadlineEventId/performanceEventId, or a stale render could delete nothing while still
      // clearing the id from a calendar event that's actually still live, orphaning it.
      const opportunity = store.all.find((o) => o.id === id);

      // Once you've applied or been accepted, the deadline reminder no longer serves a purpose
      // — but an accepted opportunity's performance is still coming up, so that event stays.
      // A rejected opportunity needs neither reminder.
      if (opportunity && (status === "applied" || status === "accepted")) {
        await calendarService.deleteDeadlineEvent(opportunity);
        await store.update(id, { status, deadlineEventId: null });
      } else if (opportunity && status === "rejected") {
        await calendarService.deleteDeadlineEvent(opportunity);
        await calendarService.deletePerformanceEvent(opportunity);
        await store.update(id, { status, deadlineEventId: null, performanceEventId: null });
      } else {
        await store.updateStatus(id, status);
      }

      setOpportunities(store.all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await store.remove(id);
      setOpportunities(store.all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete opportunity.");
    }
  };

  const handleSync = async (id: string, kind: SyncKind) => {
    const opportunity = opportunities.find((o) => o.id === id);
    if (!opportunity) return;

    setError(null);
    setSyncingKey(`${id}-${kind}`);
    try {
      const synced =
        kind === "deadline"
          ? await calendarService.syncDeadlineEvent(opportunity)
          : await calendarService.syncPerformanceEvent(opportunity);
      await store.update(id, {
        deadlineEventId: synced.deadlineEventId,
        performanceEventId: synced.performanceEventId,
      });
      setOpportunities(store.all);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to sync ${kind} to calendar.`);
    } finally {
      setSyncingKey(null);
    }
  };

  if (!session) {
    return (
      <div className="signin-screen">
        <div className="signin-card">
          <span className="brand-mark" aria-hidden="true">D</span>
          <h1>
            Dance<em>Tracker</em>
          </h1>
          <p>Sign in with Google to track your opportunities and sync deadlines to your calendar.</p>
          <button type="button" className="btn btn-primary" onClick={() => signInWithGoogle()}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-brand">
          <span className="brand-mark" aria-hidden="true">D</span>
          <h1>
            Dance<em>Tracker</em>
          </h1>
        </div>
        <div className="app-header-user">
          <span className="email">{session.user.email}</span>
          <span className={`calendar-status${calendarConnected ? " is-active" : ""}`}>
            Calendar {calendarConnected ? "connected" : "not connected"}
          </span>
          <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <div className="app-layout">
        <aside className="form-panel">
          <BulkAddOpportunities
            existingUrls={new Set(opportunities.map((o) => o.instagramUrl))}
            onAdd={handleAdd}
          />
          <AddOpportunityForm onSubmit={handleAdd} />
        </aside>
        <main className="list-panel">
          <div className="list-panel-heading">
            <h2>Opportunities</h2>
            <span className="count-badge">{opportunities.length}</span>
          </div>
          <OpportunityList
            opportunities={opportunities}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onSync={handleSync}
            syncingKey={syncingKey}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
