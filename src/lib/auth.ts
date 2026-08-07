import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: "https://www.googleapis.com/auth/calendar.events",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * True only for the session immediately after the OAuth callback — Supabase does not
 * persist provider_refresh_token, so this does not reflect whether calendar access
 * will still work after a reload (see ticket 4: server-side token persistence).
 */
export function hasCalendarAccessThisSession(session: Session | null): boolean {
  return Boolean(session?.provider_refresh_token);
}
