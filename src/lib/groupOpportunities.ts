import type { Opportunity, OpportunityStatus } from "../models/opportunity";

const STATUS_ORDER: OpportunityStatus[] = ["discovered", "applied", "accepted", "rejected"];

export interface OpportunityGroup {
  status: OpportunityStatus;
  opportunities: Opportunity[];
}

/** The date that actually drives urgency for a given opportunity: the deadline for anything
 * still pending a decision, but the performance date once accepted — the deadline is no longer
 * actionable at that point (and its calendar event may already be gone, see App.tsx), while the
 * performance date is what's still coming up. */
function urgencyDate(opportunity: Opportunity): string | undefined {
  return opportunity.status === "accepted"
    ? opportunity.performanceDate ?? opportunity.deadline
    : opportunity.deadline ?? opportunity.performanceDate;
}

function compareByUrgency(a: Opportunity, b: Opportunity): number {
  const aDate = urgencyDate(a);
  const bDate = urgencyDate(b);
  if (aDate && bDate) return aDate.localeCompare(bDate);
  if (aDate) return -1;
  if (bDate) return 1;
  return 0; // Array.prototype.sort is stable, so ties keep their incoming (newest-first) order.
}

/** Groups opportunities by status in pipeline order, omitting any status with nothing in it so
 * the list doesn't show empty section headers. Sorts each group by urgencyDate ascending —
 * soonest first, opportunities with no relevant date sink to the bottom of their group. */
export function groupOpportunitiesByStatus(opportunities: Opportunity[]): OpportunityGroup[] {
  return STATUS_ORDER.map((status) => ({
    status,
    opportunities: opportunities.filter((o) => o.status === status).sort(compareByUrgency),
  })).filter((group) => group.opportunities.length > 0);
}
