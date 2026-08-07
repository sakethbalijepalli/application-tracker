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
