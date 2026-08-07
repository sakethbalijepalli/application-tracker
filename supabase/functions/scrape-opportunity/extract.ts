import { extractDatesFromCaption } from "./dates.ts";
import { pickApplicationLink, type LinkedProfile } from "./pickLink.ts";

export interface ApifyInstagramPostItem {
  caption?: string;
  ownerFullName?: string;
  ownerUsername?: string;
  displayUrl?: string;
  carouselImages?: string[];
}

export type ApifyInstagramProfileItem = LinkedProfile;

export interface ScrapedOpportunityDetails {
  captionText: string;
  organizationName: string;
  applicationLink: string;
  deadline?: string;
  performanceDate?: string;
}

export function extractOpportunityDetails(
  post: ApifyInstagramPostItem,
  profile: ApifyInstagramProfileItem,
  referenceDate: Date,
  imageText: string = "",
): ScrapedOpportunityDetails {
  const caption = post.caption ?? "";
  // Caption comes first so its dates win on a keyword tie — OCR'd flyer text is a fallback
  // source, and less trustworthy than the poster's own written caption when both mention a date.
  const { deadline, performanceDate } = extractDatesFromCaption(`${caption}\n${imageText}`, referenceDate);

  return {
    captionText: caption,
    organizationName: post.ownerFullName || post.ownerUsername || "",
    applicationLink: pickApplicationLink(profile, caption),
    deadline,
    performanceDate,
  };
}

export interface ApifyWebsiteCrawlItem {
  text?: string;
}

/** Falls back to the site's hostname for organizationName — unlike an Instagram profile, a
 * crawled webpage has no reliably-present "org name" field (page <title> is usually the event
 * or program name, not the organization). applicationLink is the URL itself: unlike an
 * Instagram post, which links out to a bio link, the user found this page BY navigating to the
 * application itself. Both are just the best available default — the add form lets the user
 * correct either. */
export function extractOpportunityDetailsFromWebpage(
  item: ApifyWebsiteCrawlItem,
  sourceUrl: string,
  referenceDate: Date,
): ScrapedOpportunityDetails {
  const text = item.text ?? "";
  const { deadline, performanceDate } = extractDatesFromCaption(text, referenceDate);

  let organizationName = "";
  try {
    organizationName = new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    // Malformed sourceUrl — leave organizationName blank rather than throwing.
  }

  return {
    captionText: text,
    organizationName,
    applicationLink: sourceUrl,
    deadline,
    performanceDate,
  };
}
