export interface ProfileLink {
  title?: string;
  url?: string;
}

export interface LinkedProfile {
  externalUrl?: string;
  externalUrls?: ProfileLink[];
}

const APPLICATION_KEYWORDS = [
  "apply",
  "application",
  "audition",
  "register",
  "registration",
  "signup",
  "sign up",
  "rsvp",
  "casting",
  "submission",
  "submit",
];

function keywordScore(title: string | undefined): number {
  if (!title) return 0;
  const lower = title.toLowerCase();
  return APPLICATION_KEYWORDS.some((keyword) => lower.includes(keyword)) ? 10 : 0;
}

/** Splits on anything that isn't a Unicode letter or number, so accented names
 * (e.g. "Mānanā") stay intact instead of being shredded by an ASCII-only split. */
function words(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function captionOverlapScore(title: string | undefined, caption: string): number {
  if (!title) return 0;
  const captionWords = new Set(words(caption).filter((word) => word.length >= 4));
  return words(title).filter((word) => captionWords.has(word)).length;
}

/**
 * Picks the profile link most likely to be the opportunity's application link. Instagram
 * profiles can expose both a single `externalUrl` and a full `externalUrls` array (e.g. one
 * pinned link alongside several bio links) — the array is the source of truth when present,
 * since `externalUrl` isn't guaranteed to be the contextually relevant one. Candidates are
 * scored by title keywords and caption word overlap before falling back to the first link
 * when nothing distinguishes them.
 */
export function pickApplicationLink(profile: LinkedProfile, caption: string): string {
  const links = profile.externalUrls ?? [];
  if (links.length === 0) return profile.externalUrl ?? "";
  if (links.length === 1) return links[0].url ?? "";

  let best = links[0];
  let bestScore = keywordScore(links[0].title) + captionOverlapScore(links[0].title, caption);

  for (const link of links.slice(1)) {
    const score = keywordScore(link.title) + captionOverlapScore(link.title, caption);
    if (score > bestScore) {
      best = link;
      bestScore = score;
    }
  }

  return best.url ?? "";
}
