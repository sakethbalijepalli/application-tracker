import { supabase } from "../lib/supabaseClient";
import type { CalendarClient, SaveEventInput } from "./calendarClient";

export class GoogleCalendarClient implements CalendarClient {
  async saveEvent(input: SaveEventInput): Promise<string> {
    const { data, error } = await supabase.functions.invoke<{ eventId: string }>("sync-calendar-event", {
      body: {
        identifier: input.identifier,
        title: input.title,
        startDate: input.startDate.toISOString(),
        endDate: input.endDate.toISOString(),
        notes: input.notes,
        reminderMinutesBefore: input.reminderMinutesBefore,
      },
    });
    if (error) throw error;
    if (!data) throw new Error("No data returned from sync-calendar-event.");
    return data.eventId;
  }

  async deleteEvent(identifier: string): Promise<void> {
    const { error } = await supabase.functions.invoke("sync-calendar-event", {
      body: { action: "delete", identifier },
    });
    if (error) throw error;
  }
}
