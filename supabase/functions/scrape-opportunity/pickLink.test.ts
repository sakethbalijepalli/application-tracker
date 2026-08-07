import { assertEquals } from "jsr:@std/assert@1";
import { pickApplicationLink } from "./pickLink.ts";

Deno.test("falls back to externalUrl only when there are no externalUrls entries", () => {
  const link = pickApplicationLink({ externalUrl: "https://cityballet.example.com" }, "");
  assertEquals(link, "https://cityballet.example.com");
});

Deno.test("scores externalUrls entries even when externalUrl is also set, rather than blindly trusting externalUrl", () => {
  // Real-world case: Instagram can return both a top-level externalUrl (seemingly just
  // one of the pinned links) AND a full externalUrls array with better-titled candidates.
  // The array must still be considered, not short-circuited past.
  const link = pickApplicationLink(
    {
      externalUrl: "https://www.zeffy.com/en-US/ticketing/an-evening-of-indian-classical-dance",
      externalUrls: [
        { url: "https://www.zeffy.com/en-US/ticketing/an-evening-of-indian-classical-dance", title: "Dvayam: a double bill" },
        { url: "https://docs.google.com/forms/d/e/application", title: "Mānanā 2026-27 application" },
        { url: "https://tinyurl.com/donate", title: "Donate to Seattle ACME" },
      ],
    },
    "Applications are now open for the next few editions of Mānanā, our intimate studio performance series.",
  );
  assertEquals(link, "https://docs.google.com/forms/d/e/application");
});

Deno.test("returns empty string when there are no links at all", () => {
  assertEquals(pickApplicationLink({}, "Apply now!"), "");
});

Deno.test("returns the only link when externalUrls has exactly one entry", () => {
  const link = pickApplicationLink({ externalUrls: [{ url: "https://linktr.ee/cityballetco", title: "Instagram" }] }, "");
  assertEquals(link, "https://linktr.ee/cityballetco");
});

Deno.test("prefers a link whose title contains an application-related keyword", () => {
  const link = pickApplicationLink(
    {
      externalUrls: [
        { url: "https://instagram.com/cityballetco", title: "Instagram" },
        { url: "https://cityballet.example.com/audition-form", title: "Apply for Auditions" },
        { url: "https://cityballet.example.com/tickets", title: "Buy Tickets" },
      ],
    },
    "",
  );
  assertEquals(link, "https://cityballet.example.com/audition-form");
});

Deno.test("keyword matching is case-insensitive", () => {
  const link = pickApplicationLink(
    {
      externalUrls: [
        { url: "https://instagram.com/cityballetco", title: "Instagram" },
        { url: "https://cityballet.example.com/apply", title: "APPLY HERE" },
      ],
    },
    "",
  );
  assertEquals(link, "https://cityballet.example.com/apply");
});

Deno.test("falls back to word overlap with the caption when no title has an application keyword", () => {
  const link = pickApplicationLink(
    {
      externalUrls: [
        { url: "https://instagram.com/cityballetco", title: "Instagram" },
        { url: "https://cityballet.example.com/showcase", title: "Fall Showcase Info" },
      ],
    },
    "Join our fall showcase this October!",
  );
  assertEquals(link, "https://cityballet.example.com/showcase");
});

Deno.test("breaks a keyword tie using word overlap, including unicode letters like ā", () => {
  const link = pickApplicationLink(
    {
      externalUrls: [
        { url: "https://tinyurl.com/other-application", title: "Sadhana Intensive: Shweta Prachande application" },
        { url: "https://docs.google.com/forms/manana", title: "Mānanā 2026-27 application" },
      ],
    },
    "Applications are now open for the next few editions of Mānanā, our intimate studio performance series.",
  );
  assertEquals(link, "https://docs.google.com/forms/manana");
});

Deno.test("falls back to the first link when nothing distinguishes them", () => {
  const link = pickApplicationLink(
    {
      externalUrls: [
        { url: "https://first.example.com", title: "Website" },
        { url: "https://second.example.com", title: "Blog" },
      ],
    },
    "Come dance with us!",
  );
  assertEquals(link, "https://first.example.com");
});
