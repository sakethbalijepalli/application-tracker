export type OpportunityStatus = "discovered" | "applied" | "accepted" | "rejected";

export interface Opportunity {
  id: string;
  instagramUrl: string;
  captionText: string;
  applicationLink: string;
  organizationName: string;
  deadline?: string;
  performanceDate?: string;
  deadlineEventId?: string;
  performanceEventId?: string;
  status: OpportunityStatus;
  createdAt: string;
}

/**
 * Patch type for OpportunityRepository/OpportunityStore.update(). For most fields, an omitted
 * key means "leave untouched" (ordinary Partial semantics). deadlineEventId/performanceEventId
 * additionally accept an explicit `null` to mean "clear this field" — distinct from `undefined`
 * (omitted), which leaves it as-is. Opportunity itself never holds `null` for these; only a
 * patch can express "clear" as a deliberate action.
 */
export type OpportunityPatch = Partial<Omit<Opportunity, "id" | "deadlineEventId" | "performanceEventId">> & {
  deadlineEventId?: string | null;
  performanceEventId?: string | null;
};

export interface NewOpportunityInput {
  instagramUrl: string;
  captionText?: string;
  applicationLink?: string;
  organizationName?: string;
  deadline?: string;
  performanceDate?: string;
}

export function createOpportunity(input: NewOpportunityInput): Opportunity {
  return {
    id: crypto.randomUUID(),
    instagramUrl: input.instagramUrl,
    captionText: input.captionText ?? "",
    applicationLink: input.applicationLink ?? "",
    organizationName: input.organizationName ?? "",
    deadline: input.deadline,
    performanceDate: input.performanceDate,
    status: "discovered",
    createdAt: new Date().toISOString(),
  };
}
