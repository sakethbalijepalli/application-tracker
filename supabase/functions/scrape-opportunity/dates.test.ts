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
