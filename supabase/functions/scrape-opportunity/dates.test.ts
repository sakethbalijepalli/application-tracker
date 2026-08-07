import { assertEquals } from "jsr:@std/assert@1";
import { extractDatesFromCaption } from "./dates.ts";

const REF_JAN_2026 = new Date(2026, 0, 1);

Deno.test("extracts a deadline near 'apply by' with an explicit year", () => {
  const result = extractDatesFromCaption("Auditions open! Apply by March 3, 2026 for a spot.", REF_JAN_2026);
  assertEquals(result.deadline, "2026-03-03");
});

Deno.test("extracts a performance date near 'showcase'", () => {
  const result = extractDatesFromCaption("Join our showcase happening on April 20, 2026 downtown.", REF_JAN_2026);
  assertEquals(result.performanceDate, "2026-04-20");
});

Deno.test("extracts both deadline and performance date from the same caption", () => {
  const result = extractDatesFromCaption(
    "Deadline: March 3, 2026. Show date: April 20, 2026.",
    REF_JAN_2026,
  );
  assertEquals(result.deadline, "2026-03-03");
  assertEquals(result.performanceDate, "2026-04-20");
});

Deno.test("parses numeric M/D/YYYY dates", () => {
  const result = extractDatesFromCaption("Applications close 3/15/2026.", REF_JAN_2026);
  assertEquals(result.deadline, "2026-03-15");
});

Deno.test("rolls a yearless date forward to next year when it has already passed", () => {
  const referenceDate = new Date(2026, 5, 1); // June 1, 2026
  const result = extractDatesFromCaption("Apply by March 3rd for a spot.", referenceDate);
  assertEquals(result.deadline, "2027-03-03");
});

Deno.test("keeps a yearless date in the current year when it has not passed yet", () => {
  const referenceDate = new Date(2026, 0, 1); // January 1, 2026
  const result = extractDatesFromCaption("Apply by March 3rd for a spot.", referenceDate);
  assertEquals(result.deadline, "2026-03-03");
});

Deno.test("returns no dates when the caption has none", () => {
  const result = extractDatesFromCaption("Come dance with us, no experience required!", REF_JAN_2026);
  assertEquals(result.deadline, undefined);
  assertEquals(result.performanceDate, undefined);
});

Deno.test("does not guess a classification when a date has no nearby keyword", () => {
  const result = extractDatesFromCaption("Founded in 2010, see you March 3.", REF_JAN_2026);
  assertEquals(result.deadline, undefined);
  assertEquals(result.performanceDate, undefined);
});

Deno.test("only takes the first match for each category when multiple dates share a keyword type", () => {
  const result = extractDatesFromCaption(
    "Deadline: March 3, 2026. Second deadline: April 1, 2026.",
    REF_JAN_2026,
  );
  assertEquals(result.deadline, "2026-03-03");
});

Deno.test("recognizes 'scheduled for' as a performance-date keyword", () => {
  const result = extractDatesFromCaption(
    "The next edition is tentatively scheduled for November 1, 2026.",
    REF_JAN_2026,
  );
  assertEquals(result.performanceDate, "2026-11-01");
});

Deno.test("recognizes plain 'due' (without 'by') as a deadline keyword", () => {
  const referenceDate = new Date(2026, 0, 1);
  const result = extractDatesFromCaption("AUDITIONS\nApplication due August 31", referenceDate);
  assertEquals(result.deadline, "2026-08-31");
});

Deno.test("recognizes 'submitted by' as a deadline keyword", () => {
  const referenceDate = new Date(2026, 0, 1);
  const result = extractDatesFromCaption(
    "Application must be submitted by Aug 31st for that specific performance.",
    referenceDate,
  );
  assertEquals(result.deadline, "2026-08-31");
});

Deno.test("does not let a plural category label like 'Performances' misclassify a nearby date", () => {
  const referenceDate = new Date(2026, 0, 1);
  const result = extractDatesFromCaption(
    "Entries for SHORT WORKS & ALTERNATIVE SPACE Performances August 1 to September 1!",
    referenceDate,
  );
  assertEquals(result.performanceDate, undefined);
});

Deno.test("uses the end date of an unqualified 'to' range as the deadline", () => {
  const referenceDate = new Date(2026, 0, 1);
  const result = extractDatesFromCaption(
    "Entries for SHORT WORKS & ALTERNATIVE SPACE Performances August 1 to September 1!",
    referenceDate,
  );
  assertEquals(result.deadline, "2026-09-01");
});

Deno.test("keeps the start date as the deadline when a 'to' range is explicitly marked with a deadline keyword", () => {
  const referenceDate = new Date(2026, 0, 1);
  const result = extractDatesFromCaption(
    "Deadline: March 3 to March 10, 2026.",
    referenceDate,
  );
  assertEquals(result.deadline, "2026-03-10");
});

Deno.test("captures the explicit year on a hyphenated day-range date", () => {
  const referenceDate = new Date(2026, 0, 1);
  const result = extractDatesFromCaption(
    "The event is taking place March 5-7, 2027 in Kalamazoo.",
    referenceDate,
  );
  assertEquals(result.performanceDate, "2027-03-05");
});

Deno.test("uses the start date of a 'to' range as the performance date when the range describes a run of shows", () => {
  const referenceDate = new Date(2026, 0, 1);
  const result = extractDatesFromCaption(
    "Performing at the Wellspring Theater June 12 to June 14, 2026.",
    referenceDate,
  );
  assertEquals(result.performanceDate, "2026-06-12");
  assertEquals(result.deadline, undefined);
});

Deno.test("a yearless 'to' range scraped after its own end date rolls to next year, same as any other yearless date", () => {
  // Documents existing behavior, not a fix: resolveYear() has always rolled a passed yearless
  // date forward (see the rollover tests above). Scraping "Aug 1 to Sep 1" after Sep 1 has
  // already passed inherits that same assumption for the range's end date.
  const referenceDate = new Date(2026, 8, 15); // Sept 15, 2026 — after the window closed
  const result = extractDatesFromCaption(
    "Entries for SHORT WORKS & ALTERNATIVE SPACE Performances August 1 to September 1!",
    referenceDate,
  );
  assertEquals(result.deadline, "2027-09-01");
});

Deno.test("extracts both deadline and performance date from a real multi-category open-call caption", () => {
  const referenceDate = new Date(2026, 0, 1);
  const caption = [
    "Artist submissions are OPEN 🎉",
    "RADFest is welcoming entries for SHORT WORKS & ALTERNATIVE SPACE Performances August 1 to September 1!",
    "",
    "We are looking to provide emerging, professional, and experimental artists the opportunity",
    "to present their work at RADFest, taking place March 5-7, 2027. Artists will experience a",
    "juried event hosted and supported by Wellspring, in downtown Kalamazoo, MI.",
    "",
    "Stay tuned for more category submissions:",
    "❇️ Dance Film Series & Durational Instillation ➡️September 15, 2026",
    "❇️Young Artist Series ➡️December 1, 2026",
  ].join("\n");
  const result = extractDatesFromCaption(caption, referenceDate);
  assertEquals(result.deadline, "2026-09-01");
  assertEquals(result.performanceDate, "2027-03-05");
});
