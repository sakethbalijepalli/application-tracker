import { assertEquals } from "jsr:@std/assert@1";
import { buildGoogleEventResource } from "./eventPayload.ts";

Deno.test("maps title to summary and notes to description", () => {
  const resource = buildGoogleEventResource({
    title: "Application Deadline — City Ballet",
    startDate: "2026-11-01T00:00:00.000Z",
    endDate: "2026-11-01T01:00:00.000Z",
    notes: "https://instagram.com/p/abc",
    reminderMinutesBefore: [1440],
  });

  assertEquals(resource.summary, "Application Deadline — City Ballet");
  assertEquals(resource.description, "https://instagram.com/p/abc");
});

Deno.test("builds an all-day event from just the start date's calendar day, ignoring time-of-day and endDate", () => {
  // startDate/endDate only ever carry a date, no meaningful time-of-day (no time picker exists
  // in the app) — an all-day event is immune to the UTC-midnight-shifts-a-day-locally bug that
  // a timed dateTime+timeZone event would hit for any viewer in a negative UTC offset timezone.
  const resource = buildGoogleEventResource({
    title: "t",
    startDate: "2026-11-01T00:00:00.000Z",
    endDate: "2026-11-01T01:00:00.000Z",
    reminderMinutesBefore: [],
  });

  assertEquals(resource.start, { date: "2026-11-01" });
  // Google's all-day end date is exclusive: a one-day event spans [start, start + 1 day).
  assertEquals(resource.end, { date: "2026-11-02" });
});

Deno.test("rolls the exclusive end date across a month boundary", () => {
  const resource = buildGoogleEventResource({
    title: "t",
    startDate: "2026-11-30T00:00:00.000Z",
    endDate: "2026-11-30T01:00:00.000Z",
    reminderMinutesBefore: [],
  });

  assertEquals(resource.start, { date: "2026-11-30" });
  assertEquals(resource.end, { date: "2026-12-01" });
});

Deno.test("maps reminderMinutesBefore to popup reminder overrides with useDefault false", () => {
  const resource = buildGoogleEventResource({
    title: "t",
    startDate: "2026-11-01T00:00:00.000Z",
    endDate: "2026-11-01T01:00:00.000Z",
    reminderMinutesBefore: [4320, 1440],
  });

  assertEquals(resource.reminders, {
    useDefault: false,
    overrides: [
      { method: "popup", minutes: 4320 },
      { method: "popup", minutes: 1440 },
    ],
  });
});

Deno.test("omits description when notes is not provided", () => {
  const resource = buildGoogleEventResource({
    title: "t",
    startDate: "2026-11-01T00:00:00.000Z",
    endDate: "2026-11-01T01:00:00.000Z",
    reminderMinutesBefore: [],
  });

  assertEquals(resource.description, undefined);
});

Deno.test("produces no reminders (not Google's defaults) when reminderMinutesBefore is empty", () => {
  const resource = buildGoogleEventResource({
    title: "t",
    startDate: "2026-11-01T00:00:00.000Z",
    endDate: "2026-11-01T01:00:00.000Z",
    reminderMinutesBefore: [],
  });

  assertEquals(resource.reminders, { useDefault: false, overrides: [] });
});
