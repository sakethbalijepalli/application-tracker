import { supabase } from "./supabaseClient";

export async function storeCalendarToken(refreshToken: string): Promise<void> {
  const { error } = await supabase.functions.invoke("store-calendar-token", {
    body: { refreshToken },
  });
  if (error) throw error;
}
