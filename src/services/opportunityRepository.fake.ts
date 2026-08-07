import {
  createOpportunity,
  type NewOpportunityInput,
  type Opportunity,
  type OpportunityPatch,
} from "../models/opportunity";
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

  async update(id: string, patch: OpportunityPatch): Promise<Opportunity> {
    const index = this.opportunities.findIndex((opportunity) => opportunity.id === id);
    if (index === -1) throw new Error(`Opportunity not found: ${id}`);

    // undefined means "leave untouched" (omitted from the patch); null means "clear it" —
    // mirrors how SupabaseOpportunityRepository treats the same distinction against real columns.
    const updated: Opportunity = { ...this.opportunities[index] };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      (updated as unknown as Record<string, unknown>)[key] = value === null ? undefined : value;
    }
    this.opportunities[index] = updated;
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.opportunities = this.opportunities.filter((opportunity) => opportunity.id !== id);
  }
}
