import { describe, expect, it } from "vitest";
import { createOpportunity, type Opportunity } from "../models/opportunity";
import { groupOpportunitiesByStatus } from "./groupOpportunities";

function opportunity(overrides: Partial<Opportunity>): Opportunity {
  return { ...createOpportunity({ instagramUrl: "https://instagram.com/p/x" }), ...overrides };
}

describe("groupOpportunitiesByStatus", () => {
  it("groups into sections ordered discovered, applied, accepted, rejected", () => {
    const groups = groupOpportunitiesByStatus([
      opportunity({ id: "1", status: "rejected" }),
      opportunity({ id: "2", status: "accepted" }),
      opportunity({ id: "3", status: "discovered" }),
      opportunity({ id: "4", status: "applied" }),
    ]);

    expect(groups.map((g) => g.status)).toEqual(["discovered", "applied", "accepted", "rejected"]);
  });

  it("omits a status group entirely when nothing is in it", () => {
    const groups = groupOpportunitiesByStatus([
      opportunity({ id: "1", status: "discovered" }),
      opportunity({ id: "2", status: "accepted" }),
    ]);

    expect(groups.map((g) => g.status)).toEqual(["discovered", "accepted"]);
  });

  it("sorts within a group by soonest deadline first", () => {
    const groups = groupOpportunitiesByStatus([
      opportunity({ id: "1", status: "discovered", deadline: "2026-12-01" }),
      opportunity({ id: "2", status: "discovered", deadline: "2026-09-01" }),
      opportunity({ id: "3", status: "discovered", deadline: "2026-10-15" }),
    ]);

    expect(groups[0].opportunities.map((o) => o.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts accepted opportunities by performance date rather than the (no-longer-actionable) deadline", () => {
    const groups = groupOpportunitiesByStatus([
      opportunity({ id: "1", status: "accepted", deadline: "2026-01-01", performanceDate: "2027-05-01" }),
      opportunity({ id: "2", status: "accepted", deadline: "2026-06-01", performanceDate: "2027-02-01" }),
    ]);

    expect(groups[0].opportunities.map((o) => o.id)).toEqual(["2", "1"]);
  });

  it("sinks opportunities with no relevant date to the bottom of their group", () => {
    const groups = groupOpportunitiesByStatus([
      opportunity({ id: "1", status: "discovered" }),
      opportunity({ id: "2", status: "discovered", deadline: "2026-09-01" }),
    ]);

    expect(groups[0].opportunities.map((o) => o.id)).toEqual(["2", "1"]);
  });

  it("returns no groups for an empty list", () => {
    expect(groupOpportunitiesByStatus([])).toEqual([]);
  });
});
