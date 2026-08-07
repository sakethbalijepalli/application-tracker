import type { NewOpportunityInput, Opportunity, OpportunityStatus } from "../models/opportunity";
import type { OpportunityRepository } from "./opportunityRepository";

export class OpportunityStore {
  private readonly repository: OpportunityRepository;
  private opportunities: Opportunity[] = [];

  constructor(repository: OpportunityRepository) {
    this.repository = repository;
  }

  get all(): Opportunity[] {
    return this.opportunities;
  }

  async load(): Promise<Opportunity[]> {
    this.opportunities = await this.repository.list();
    return this.opportunities;
  }

  async add(input: NewOpportunityInput): Promise<Opportunity> {
    const created = await this.repository.create(input);
    this.opportunities = [...this.opportunities, created];
    return created;
  }

  async updateStatus(id: string, status: OpportunityStatus): Promise<Opportunity> {
    const updated = await this.repository.update(id, { status });
    this.opportunities = this.opportunities.map((opportunity) =>
      opportunity.id === id ? updated : opportunity,
    );
    return updated;
  }
}
