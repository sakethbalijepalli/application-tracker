import type { NewOpportunityInput, Opportunity } from "../models/opportunity";

export interface OpportunityRepository {
  list(): Promise<Opportunity[]>;
  create(input: NewOpportunityInput): Promise<Opportunity>;
  update(id: string, patch: Partial<Omit<Opportunity, "id">>): Promise<Opportunity>;
  remove(id: string): Promise<void>;
}
