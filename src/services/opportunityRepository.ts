import type { NewOpportunityInput, Opportunity, OpportunityPatch } from "../models/opportunity";

export interface OpportunityRepository {
  list(): Promise<Opportunity[]>;
  create(input: NewOpportunityInput): Promise<Opportunity>;
  update(id: string, patch: OpportunityPatch): Promise<Opportunity>;
  remove(id: string): Promise<void>;
}
