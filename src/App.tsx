import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { AddOpportunityForm } from "./components/AddOpportunityForm";
import { OpportunityList } from "./components/OpportunityList";
import { hasCalendarAccessThisSession, signInWithGoogle, signOut } from "./lib/auth";
import { supabase } from "./lib/supabaseClient";
import type { Opportunity, OpportunityStatus } from "./models/opportunity";
import { SupabaseOpportunityRepository } from "./services/opportunityRepository.supabase";
import { OpportunityStore } from "./services/opportunityStore";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const store = useMemo(() => new OpportunityStore(new SupabaseOpportunityRepository(supabase)), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
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
      await store.updateStatus(id, status);
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

  const calendarAccess = hasCalendarAccessThisSession(session);

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
          <span className={`calendar-status${calendarAccess ? " is-active" : ""}`}>
            Calendar access {calendarAccess ? "granted this session" : "not granted"}
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
          />
        </main>
      </div>
    </div>
  );
}

export default App;
