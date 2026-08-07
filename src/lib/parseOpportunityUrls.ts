/** Parses a block of pasted text into a deduped list of URLs — one or many per line,
 * comma-separated, or mixed. An opportunity may be an Instagram post or a direct application
 * page on any site, so anything that isn't a valid http(s) URL is silently dropped rather than
 * rejecting the whole paste. */
export function parseOpportunityUrls(rawText: string): string[] {
  const candidates = rawText
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => {
      try {
        return new URL(token).protocol.startsWith("http");
      } catch {
        return false;
      }
    });

  return [...new Set(candidates)];
}
