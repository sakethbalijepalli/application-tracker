import { createOpportunity, type NewOpportunityInput, type Opportunity } from "../models/opportunity";
import type { OpportunityRepository } from "./opportunityRepository";

export class FakeOpportunityRepository implements OpportunityRepository {
  opportunities: Opportunity[] = [];

  async list(): Promise<Opportunity[]> {
    return [...this.opportunities];
  }

  async create(input: NewOpportunityInput): Promise<Opportunity> {
    const created = createOpportunity(input);
    this.opportunities.push(created);
    return created;
  }

  async update(id: string, patch: Partial<Omit<Opportunity, "id">>): Promise<Opportunity> {
    const index = this.opportunities.findIndex((opportunity) => opportunity.id === id);
    if (index === -1) throw new Error(`Opportunity not found: ${id}`);

    const updated = { ...this.opportunities[index], ...patch };
    this.opportunities[index] = updated;
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.opportunities = this.opportunities.filter((opportunity) => opportunity.id !== id);
  }
}
