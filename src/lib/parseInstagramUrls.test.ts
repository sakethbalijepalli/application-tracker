import { describe, expect, it } from "vitest";
import { parseInstagramUrls } from "./parseInstagramUrls";

describe("parseInstagramUrls", () => {
  it("splits multiple URLs pasted on separate lines", () => {
    const input = "https://instagram.com/p/abc\nhttps://instagram.com/p/xyz";
    expect(parseInstagramUrls(input)).toEqual([
      "https://instagram.com/p/abc",
      "https://instagram.com/p/xyz",
    ]);
  });

  it("trims whitespace around each URL", () => {
    const input = "  https://instagram.com/p/abc  \n  https://instagram.com/p/xyz  ";
    expect(parseInstagramUrls(input)).toEqual([
      "https://instagram.com/p/abc",
      "https://instagram.com/p/xyz",
    ]);
  });

  it("splits comma-separated URLs on the same line too", () => {
    const input = "https://instagram.com/p/abc, https://instagram.com/p/xyz";
    expect(parseInstagramUrls(input)).toEqual([
      "https://instagram.com/p/abc",
      "https://instagram.com/p/xyz",
    ]);
  });

  it("ignores blank lines", () => {
    const input = "https://instagram.com/p/abc\n\n\nhttps://instagram.com/p/xyz\n";
    expect(parseInstagramUrls(input)).toEqual([
      "https://instagram.com/p/abc",
      "https://instagram.com/p/xyz",
    ]);
  });

  it("filters out lines that aren't instagram.com URLs", () => {
    const input = "https://instagram.com/p/abc\nnot a url\nhttps://example.com/p/xyz";
    expect(parseInstagramUrls(input)).toEqual(["https://instagram.com/p/abc"]);
  });

  it("dedupes exact duplicate URLs, keeping the first occurrence", () => {
    const input = "https://instagram.com/p/abc\nhttps://instagram.com/p/xyz\nhttps://instagram.com/p/abc";
    expect(parseInstagramUrls(input)).toEqual([
      "https://instagram.com/p/abc",
      "https://instagram.com/p/xyz",
    ]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseInstagramUrls("   \n  \n")).toEqual([]);
  });
});
