import { describe, expect, it } from "vitest";
import { parseOpportunityUrls } from "./parseOpportunityUrls";

describe("parseOpportunityUrls", () => {
  it("splits multiple URLs pasted on separate lines", () => {
    const input = "https://instagram.com/p/abc\nhttps://instagram.com/p/xyz";
    expect(parseOpportunityUrls(input)).toEqual([
      "https://instagram.com/p/abc",
      "https://instagram.com/p/xyz",
    ]);
  });

  it("trims whitespace around each URL", () => {
    const input = "  https://instagram.com/p/abc  \n  https://instagram.com/p/xyz  ";
    expect(parseOpportunityUrls(input)).toEqual([
      "https://instagram.com/p/abc",
      "https://instagram.com/p/xyz",
    ]);
  });

  it("splits comma-separated URLs on the same line too", () => {
    const input = "https://instagram.com/p/abc, https://instagram.com/p/xyz";
    expect(parseOpportunityUrls(input)).toEqual([
      "https://instagram.com/p/abc",
      "https://instagram.com/p/xyz",
    ]);
  });

  it("ignores blank lines", () => {
    const input = "https://instagram.com/p/abc\n\n\nhttps://instagram.com/p/xyz\n";
    expect(parseOpportunityUrls(input)).toEqual([
      "https://instagram.com/p/abc",
      "https://instagram.com/p/xyz",
    ]);
  });

  it("accepts a direct application-page URL on any site, not just instagram.com", () => {
    const input =
      "https://instagram.com/p/abc\nnot a url\nhttps://www.danzaorganica.org/Apply-to-the-We-Create.php?utm_source=ig";
    expect(parseOpportunityUrls(input)).toEqual([
      "https://instagram.com/p/abc",
      "https://www.danzaorganica.org/Apply-to-the-We-Create.php?utm_source=ig",
    ]);
  });

  it("filters out tokens that aren't valid URLs at all", () => {
    const input = "https://instagram.com/p/abc\nnot a url\njust some text";
    expect(parseOpportunityUrls(input)).toEqual(["https://instagram.com/p/abc"]);
  });

  it("filters out non-http(s) schemes", () => {
    const input = "https://instagram.com/p/abc\nmailto:someone@example.com\nftp://old.example.com/file";
    expect(parseOpportunityUrls(input)).toEqual(["https://instagram.com/p/abc"]);
  });

  it("dedupes exact duplicate URLs, keeping the first occurrence", () => {
    const input = "https://instagram.com/p/abc\nhttps://instagram.com/p/xyz\nhttps://instagram.com/p/abc";
    expect(parseOpportunityUrls(input)).toEqual([
      "https://instagram.com/p/abc",
      "https://instagram.com/p/xyz",
    ]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseOpportunityUrls("   \n  \n")).toEqual([]);
  });
});
