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
