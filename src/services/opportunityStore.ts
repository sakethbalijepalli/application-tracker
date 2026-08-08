import type { NewOpportunityInput, Opportunity, OpportunityPatch, OpportunityStatus } from "../models/opportunity";
import type { OpportunityRepository } from "./opportunityRepository";

function normalizeOrgName(name: string | undefined): string {
  return (name ?? "").trim().toLowerCase();
}

function dateOnly(iso: string | undefined): string {
  return iso?.slice(0, 10) ?? "";
}

/** Thrown by add() when isDuplicate() matches. A distinct class (not a plain Error) so callers —
 * e.g. bulk-add — can tell "this is already tracked, skip it" apart from a real failure without
 * resorting to fragile message matching. */
export class DuplicateOpportunityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateOpportunityError";
  }
}

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
    if (this.isDuplicate(input)) {
      throw new DuplicateOpportunityError(
        "An opportunity for this organization with these dates has already been added.",
      );
    }
    const created = await this.repository.create(input);
    this.opportunities = [...this.opportunities, created];
    return created;
  }

  /** Same organization + same deadline + same performance date counts as "the same opportunity"
   * — e.g. re-pasting a link already added, or a different link (Instagram post vs. its own
   * application page) for something already tracked. Requires a non-blank organizationName and
   * at least one date to avoid false-positives on entries where scraping found neither.
   *
   * Dates are compared by calendar day only, not as exact strings: bulk-add persists the
   * scraper's bare "YYYY-MM-DD" deadline as-is, while the single-add form always converts
   * through new Date(...).toISOString() before submitting (even for an unedited scraped value)
   * — same date, two different string shapes. Slicing to the first 10 chars normalizes both,
   * since a bare date string and a full ISO timestamp share that prefix. Org names are compared
   * case-insensitively and trimmed for the same reason: scraped and hand-typed names shouldn't
   * fail to match over incidental formatting differences. */
  private isDuplicate(input: NewOpportunityInput): boolean {
    const organizationName = normalizeOrgName(input.organizationName);
    if (!organizationName) return false;
    const deadline = dateOnly(input.deadline);
    const performanceDate = dateOnly(input.performanceDate);
    if (!deadline && !performanceDate) return false;

    return this.opportunities.some(
      (opportunity) =>
        normalizeOrgName(opportunity.organizationName) === organizationName &&
        dateOnly(opportunity.deadline) === deadline &&
        dateOnly(opportunity.performanceDate) === performanceDate,
    );
  }

  async updateStatus(id: string, status: OpportunityStatus): Promise<Opportunity> {
    return this.update(id, { status });
  }

  async update(id: string, patch: OpportunityPatch): Promise<Opportunity> {
    const updated = await this.repository.update(id, patch);
    this.opportunities = this.opportunities.map((opportunity) =>
      opportunity.id === id ? updated : opportunity,
    );
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repository.remove(id);
    this.opportunities = this.opportunities.filter((opportunity) => opportunity.id !== id);
  }
}
