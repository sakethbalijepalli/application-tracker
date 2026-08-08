/** Reduces a URL to the form used for "is this the same link" comparisons — strips query
 * params (utm_* campaign tags, Instagram's igsh share token, etc.) and a trailing slash, since
 * the same post/page shared on two different occasions commonly carries different tracking
 * params but is still the same link. Returns the input unchanged if it isn't a valid URL, so
 * callers can compare failed-to-parse tokens by their raw text instead of crashing. */
export function normalizeUrlForComparison(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.length > 1 && parsed.pathname.endsWith("/")
      ? parsed.pathname.slice(0, -1)
      : parsed.pathname;
    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch {
    return url;
  }
}

/** Parses a block of pasted text into a deduped list of URLs — one or many per line,
 * comma-separated, or mixed. An opportunity may be an Instagram post or a direct application
 * page on any site, so anything that isn't a valid http(s) URL is silently dropped rather than
 * rejecting the whole paste. Two URLs that are the same link with different tracking params
 * (see normalizeUrlForComparison) are deduped too, keeping whichever was pasted first. */
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

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const url of candidates) {
    const key = normalizeUrlForComparison(url);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(url);
  }
  return deduped;
}
