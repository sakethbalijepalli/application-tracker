export interface ExtractedDates {
  deadline?: string;
  performanceDate?: string;
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const DEADLINE_KEYWORDS = [
  "deadline",
  "apply by",
  "apply before",
  "applications close",
  "application closes",
  "due",
  "submission",
  "submitted",
  "dm by",
  "closes",
];

const PERFORMANCE_KEYWORDS = [
  "performance",
  "performing",
  "showcase",
  "show on",
  "show date",
  "event date",
  "happening on",
  "showtime",
  "scheduled for",
  "taking place",
];

// Keywords in this set only count when not immediately followed by another letter — e.g. bare
// "performance" would otherwise false-match the plural "Performances" used as a category label
// ("SHORT WORKS & ALTERNATIVE SPACE Performances"), which isn't a signal about when a date falls.
const NO_PLURAL_MATCH = new Set(["performance"]);

const MONTH_NAME_DATE = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*[-–]\s*\d{1,2}(?:st|nd|rd|th)?)?(?:,?\s*(\d{4}))?\b/gi;
const NUMERIC_DATE = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g;
// Dot-separated is the international day.month.year convention (distinct from the slash
// pattern's US month/day) — the 4-digit year is required since an unanchored day.month would
// also match version numbers or prices in noisy OCR'd flyer text.
const DOTTED_DATE = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g;
const RANGE_JOINER = /^\s*to\s*$/i;
// How far past a date to look for a classifying keyword when nothing precedes it — flyers and
// list-style pages (e.g. "26.08.2026\nDeadline") often put the label after the date, but only
// checking the *immediate* next token (past pure separator punctuation) keeps this from bleeding
// into an unrelated later sentence the way a full lookahead window would.
const AFTER_SEPARATOR = /^[\s:–—-]*/;

interface DateMatch {
  index: number;
  end: number;
  monthIndex: number;
  day: number;
  year?: number;
}

function findDateMatches(caption: string): DateMatch[] {
  const matches: DateMatch[] = [];

  for (const m of caption.matchAll(MONTH_NAME_DATE)) {
    const monthIndex = MONTH_INDEX[m[1].slice(0, 3).toLowerCase()];
    const day = Number(m[2]);
    if (monthIndex === undefined || day < 1 || day > 31) continue;
    matches.push({
      index: m.index,
      end: m.index + m[0].length,
      monthIndex,
      day,
      year: m[3] ? Number(m[3]) : undefined,
    });
  }

  for (const m of caption.matchAll(NUMERIC_DATE)) {
    const month = Number(m[1]);
    const day = Number(m[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;
    let year: number | undefined;
    if (m[3]) {
      year = Number(m[3]);
      if (year < 100) year += 2000;
    }
    matches.push({ index: m.index, end: m.index + m[0].length, monthIndex: month - 1, day, year });
  }

  for (const m of caption.matchAll(DOTTED_DATE)) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;
    matches.push({ index: m.index, end: m.index + m[0].length, monthIndex: month - 1, day, year: Number(m[3]) });
  }

  return matches.sort((a, b) => a.index - b.index);
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function resolveYear(monthIndex: number, day: number, explicitYear: number | undefined, referenceDate: Date): number {
  if (explicitYear !== undefined) return explicitYear;

  const refYear = referenceDate.getFullYear();
  const refDateOnly = new Date(refYear, referenceDate.getMonth(), referenceDate.getDate());
  const candidate = new Date(refYear, monthIndex, day);
  return candidate < refDateOnly ? refYear + 1 : refYear;
}

function toIsoDate(match: DateMatch, referenceDate: Date): string {
  const year = resolveYear(match.monthIndex, match.day, match.year, referenceDate);
  return `${year}-${pad2(match.monthIndex + 1)}-${pad2(match.day)}`;
}

function contextBefore(caption: string, index: number, windowSize = 40): string {
  return caption.slice(Math.max(0, index - windowSize), index).toLowerCase();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lastKeywordIndex(context: string, keywords: string[]): number {
  let furthest = -1;
  for (const keyword of keywords) {
    const suffix = NO_PLURAL_MATCH.has(keyword) ? "(?!s)" : "";
    const re = new RegExp(escapeRegExp(keyword) + suffix, "gi");
    for (const m of context.matchAll(re)) {
      if (m.index > furthest) furthest = m.index;
    }
  }
  return furthest;
}

/** Classifies by whichever keyword type appears closest to the date, not just "present somewhere
 * in the window" — otherwise an earlier sentence's keyword bleeds into a later date's context. */
function classify(context: string): "deadline" | "performance" | undefined {
  const deadlineIndex = lastKeywordIndex(context, DEADLINE_KEYWORDS);
  const performanceIndex = lastKeywordIndex(context, PERFORMANCE_KEYWORDS);
  if (deadlineIndex === -1 && performanceIndex === -1) return undefined;
  return deadlineIndex > performanceIndex ? "deadline" : "performance";
}

function startsWithKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => {
    if (!text.startsWith(keyword)) return false;
    const nextChar = text[keyword.length];
    return !nextChar || !/[a-z]/i.test(nextChar);
  });
}

/** Only fires when the classifying word is the very next token after the date (past pure
 * separator punctuation) — see the AFTER_SEPARATOR comment for why this stays narrow. */
function classifyAfter(caption: string, matchEnd: number, windowSize = 60): "deadline" | "performance" | undefined {
  const after = caption.slice(matchEnd, matchEnd + windowSize).toLowerCase();
  const separator = after.match(AFTER_SEPARATOR)?.[0] ?? "";
  const rest = after.slice(separator.length);
  if (startsWithKeyword(rest, DEADLINE_KEYWORDS)) return "deadline";
  if (startsWithKeyword(rest, PERFORMANCE_KEYWORDS)) return "performance";
  return undefined;
}

export function extractDatesFromCaption(caption: string, referenceDate: Date): ExtractedDates {
  const result: ExtractedDates = {};
  const matches = findDateMatches(caption);
  const consumed = new Set<number>();

  // "<date> to <date>" reads as an open/close window (e.g. "submissions Aug 1 to Sep 1") more
  // often than as two independent dates. A keyword still wins if one classifies the pair; absent
  // that, the end date is the actionable one (the last day you can still act) — the deadline.
  for (let i = 0; i < matches.length - 1; i++) {
    const first = matches[i];
    const second = matches[i + 1];
    if (!RANGE_JOINER.test(caption.slice(first.end, second.index))) continue;

    const kind = classify(contextBefore(caption, first.index));
    consumed.add(i);
    consumed.add(i + 1);

    if (kind === "performance" && !result.performanceDate) {
      result.performanceDate = toIsoDate(first, referenceDate);
    } else if (!result.deadline) {
      result.deadline = toIsoDate(second, referenceDate);
    }
  }

  matches.forEach((match, i) => {
    if (consumed.has(i)) return;
    const kind = classify(contextBefore(caption, match.index)) ?? classifyAfter(caption, match.end);
    if (kind === "deadline" && !result.deadline) {
      result.deadline = toIsoDate(match, referenceDate);
    } else if (kind === "performance" && !result.performanceDate) {
      result.performanceDate = toIsoDate(match, referenceDate);
    }
  });

  return result;
}
