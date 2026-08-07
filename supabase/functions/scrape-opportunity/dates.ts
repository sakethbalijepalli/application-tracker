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
  "due by",
  "submission",
  "dm by",
  "closes",
];

const PERFORMANCE_KEYWORDS = [
  "performance",
  "showcase",
  "show on",
  "show date",
  "event date",
  "happening on",
  "showtime",
  "scheduled for",
];

const MONTH_NAME_DATE = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?\b/gi;
const NUMERIC_DATE = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g;

interface DateMatch {
  index: number;
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
    matches.push({ index: m.index, monthIndex, day, year: m[3] ? Number(m[3]) : undefined });
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
    matches.push({ index: m.index, monthIndex: month - 1, day, year });
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

function lastKeywordIndex(context: string, keywords: string[]): number {
  return keywords.reduce((furthest, keyword) => Math.max(furthest, context.lastIndexOf(keyword)), -1);
}

/** Classifies by whichever keyword type appears closest to the date, not just "present somewhere
 * in the window" — otherwise an earlier sentence's keyword bleeds into a later date's context. */
function classify(context: string): "deadline" | "performance" | undefined {
  const deadlineIndex = lastKeywordIndex(context, DEADLINE_KEYWORDS);
  const performanceIndex = lastKeywordIndex(context, PERFORMANCE_KEYWORDS);
  if (deadlineIndex === -1 && performanceIndex === -1) return undefined;
  return deadlineIndex > performanceIndex ? "deadline" : "performance";
}

export function extractDatesFromCaption(caption: string, referenceDate: Date): ExtractedDates {
  const result: ExtractedDates = {};

  for (const match of findDateMatches(caption)) {
    const kind = classify(contextBefore(caption, match.index));
    if (kind === "deadline" && !result.deadline) {
      result.deadline = toIsoDate(match, referenceDate);
    } else if (kind === "performance" && !result.performanceDate) {
      result.performanceDate = toIsoDate(match, referenceDate);
    }
  }

  return result;
}
