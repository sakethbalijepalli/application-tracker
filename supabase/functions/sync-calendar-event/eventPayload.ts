export interface SaveEventRequest {
  identifier?: string;
  title: string;
  startDate: string;
  endDate: string;
  notes?: string;
  reminderMinutesBefore: number[];
}

export interface GoogleEventResource {
  summary: string;
  description?: string;
  start: { date: string };
  end: { date: string };
  reminders: {
    useDefault: boolean;
    overrides: { method: "popup"; minutes: number }[];
  };
}

function toDateOnly(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

function addOneDay(dateOnly: string): string {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

/**
 * startDate/endDate only ever carry a date, never a meaningful time-of-day (no time picker
 * exists in the app), so this builds an all-day event from the start date's calendar day
 * alone — a timed dateTime+timeZone event would instead shift a day for any viewer in a
 * negative UTC offset timezone, since these dates are stored as UTC midnight.
 */
export function buildGoogleEventResource(input: SaveEventRequest): GoogleEventResource {
  const startDateOnly = toDateOnly(input.startDate);

  return {
    summary: input.title,
    description: input.notes,
    start: { date: startDateOnly },
    // All-day end dates are exclusive per the Google Calendar API: a one-day event spans
    // [start, start + 1 day).
    end: { date: addOneDay(startDateOnly) },
    reminders: {
      useDefault: false,
      overrides: input.reminderMinutesBefore.map((minutes) => ({ method: "popup" as const, minutes })),
    },
  };
}
