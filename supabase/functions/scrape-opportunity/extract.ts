import { extractDatesFromCaption } from "./dates.ts";
import { pickApplicationLink, type LinkedProfile } from "./pickLink.ts";

export interface ApifyInstagramPostItem {
  caption?: string;
  ownerFullName?: string;
  ownerUsername?: string;
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
): ScrapedOpportunityDetails {
  const caption = post.caption ?? "";
  const { deadline, performanceDate } = extractDatesFromCaption(caption, referenceDate);

  return {
    captionText: caption,
    organizationName: post.ownerFullName || post.ownerUsername || "",
    applicationLink: pickApplicationLink(profile, caption),
    deadline,
    performanceDate,
  };
}
