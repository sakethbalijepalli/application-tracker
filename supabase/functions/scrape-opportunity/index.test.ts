import { assertEquals } from "jsr:@std/assert@1";
import { extractOpportunityDetails } from "./extract.ts";

const REF_DATE = new Date(2026, 0, 1);

Deno.test("extractOpportunityDetails maps caption and prefers ownerFullName over ownerUsername", () => {
  const result = extractOpportunityDetails(
    { caption: "Auditions open for our fall showcase!", ownerFullName: "City Ballet Co", ownerUsername: "cityballetco" },
    {},
    REF_DATE,
  );

  assertEquals(result.captionText, "Auditions open for our fall showcase!");
  assertEquals(result.organizationName, "City Ballet Co");
});

Deno.test("extractOpportunityDetails falls back to ownerUsername when ownerFullName is missing", () => {
  const result = extractOpportunityDetails(
    { caption: "Open call this weekend", ownerUsername: "cityballetco" },
    {},
    REF_DATE,
  );

  assertEquals(result.organizationName, "cityballetco");
});

Deno.test("extractOpportunityDetails defaults missing post fields to empty strings", () => {
  const result = extractOpportunityDetails({}, {}, REF_DATE);

  assertEquals(result.captionText, "");
  assertEquals(result.organizationName, "");
});

Deno.test("extractOpportunityDetails uses the profile's externalUrl as the application link", () => {
  const result = extractOpportunityDetails({}, { externalUrl: "https://cityballet.example.com/auditions" }, REF_DATE);

  assertEquals(result.applicationLink, "https://cityballet.example.com/auditions");
});

Deno.test("extractOpportunityDetails falls back to the first externalUrls entry when externalUrl is absent", () => {
  const result = extractOpportunityDetails(
    {},
    { externalUrls: [{ url: "https://linktr.ee/cityballetco" }, { url: "https://second.example.com" }] },
    REF_DATE,
  );

  assertEquals(result.applicationLink, "https://linktr.ee/cityballetco");
});

Deno.test("extractOpportunityDetails defaults applicationLink to an empty string when the profile has no links", () => {
  const result = extractOpportunityDetails({}, {}, REF_DATE);

  assertEquals(result.applicationLink, "");
});

Deno.test("extractOpportunityDetails pulls deadline and performance date out of the caption", () => {
  const result = extractOpportunityDetails(
    { caption: "Deadline: March 3, 2026. Show date: April 20, 2026." },
    {},
    REF_DATE,
  );

  assertEquals(result.deadline, "2026-03-03");
  assertEquals(result.performanceDate, "2026-04-20");
});

Deno.test("extractOpportunityDetails leaves deadline/performanceDate undefined when the caption has no dates", () => {
  const result = extractOpportunityDetails({ caption: "Come dance with us!" }, {}, REF_DATE);

  assertEquals(result.deadline, undefined);
  assertEquals(result.performanceDate, undefined);
});

Deno.test("extractOpportunityDetails pulls a deadline from OCR'd flyer text when the caption doesn't mention one", () => {
  const result = extractOpportunityDetails(
    { caption: "Come dance with us! Link in bio." },
    {},
    REF_DATE,
    "AUDITIONS\nApplication due August 31",
  );

  assertEquals(result.deadline, "2026-08-31");
});

Deno.test("extractOpportunityDetails prefers a caption date over a conflicting OCR date", () => {
  const result = extractOpportunityDetails(
    { caption: "Deadline: March 3, 2026." },
    {},
    REF_DATE,
    "AUDITIONS\nApplication due August 31",
  );

  assertEquals(result.deadline, "2026-03-03");
});
