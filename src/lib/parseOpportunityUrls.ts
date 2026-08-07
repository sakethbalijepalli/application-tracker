/** Parses a block of pasted text into a deduped list of Instagram URLs — one or many per
 * line, comma-separated, or mixed. Anything that doesn't look like an instagram.com link is
 * silently dropped rather than rejecting the whole paste. */
export function parseInstagramUrls(rawText: string): string[] {
  const candidates = rawText
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.includes("instagram.com"));

  return [...new Set(candidates)];
}
