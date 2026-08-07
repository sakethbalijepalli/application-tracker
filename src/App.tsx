import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
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

  if (!session) {
    return (
      <section>
        <h1>DanceTracker</h1>
        <p>Sign in with Google to track your opportunities and sync deadlines to your calendar.</p>
        <button type="button" onClick={() => signInWithGoogle()}>
          Sign in with Google
        </button>
      </section>
    );
  }

  return (
    <section>
      <header>
        <h1>DanceTracker</h1>
        <p>
          Signed in as {session.user.email}
          {" — "}
          <button type="button" onClick={() => signOut()}>
            Sign out
          </button>
        </p>
        <p>
          Calendar access granted this session: {hasCalendarAccessThisSession(session) ? "yes" : "no"}
        </p>
      </header>

      {error && <p role="alert">{error}</p>}

      <AddOpportunityForm onSubmit={handleAdd} />
      <OpportunityList opportunities={opportunities} onStatusChange={handleStatusChange} />
    </section>
  );
}

export default App;
