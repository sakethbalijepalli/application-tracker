import { describe, expect, it } from "vitest";
import { newOpportunityToRow, rowToOpportunity } from "./opportunityRepository.supabase";

describe("rowToOpportunity", () => {
  it("maps a snake_case database row to a camelCase Opportunity", () => {
    const row = {
      id: "11111111-1111-1111-1111-111111111111",
      user_id: "22222222-2222-2222-2222-222222222222",
      instagram_url: "https://instagram.com/p/abc",
      caption_text: "Auditions open",
      application_link: "https://example.com/apply",
      organization_name: "Test Co",
      deadline: "2026-09-01T00:00:00.000Z",
      performance_date: "2026-10-01T00:00:00.000Z",
      deadline_event_id: "event-1",
      performance_event_id: "event-2",
      status: "applied" as const,
      created_at: "2026-08-01T00:00:00.000Z",
    };

    expect(rowToOpportunity(row)).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      instagramUrl: "https://instagram.com/p/abc",
      captionText: "Auditions open",
      applicationLink: "https://example.com/apply",
      organizationName: "Test Co",
      deadline: "2026-09-01T00:00:00.000Z",
      performanceDate: "2026-10-01T00:00:00.000Z",
      deadlineEventId: "event-1",
      performanceEventId: "event-2",
      status: "applied",
      createdAt: "2026-08-01T00:00:00.000Z",
    });
  });

  it("maps null optional columns to undefined fields", () => {
    const row = {
      id: "11111111-1111-1111-1111-111111111111",
      user_id: "22222222-2222-2222-2222-222222222222",
      instagram_url: "https://instagram.com/p/abc",
      caption_text: "",
      application_link: "",
      organization_name: "",
      deadline: null,
      performance_date: null,
      deadline_event_id: null,
      performance_event_id: null,
      status: "discovered" as const,
      created_at: "2026-08-01T00:00:00.000Z",
    };

    const opportunity = rowToOpportunity(row);

    expect(opportunity.deadline).toBeUndefined();
    expect(opportunity.performanceDate).toBeUndefined();
    expect(opportunity.deadlineEventId).toBeUndefined();
    expect(opportunity.performanceEventId).toBeUndefined();
  });
});

describe("newOpportunityToRow", () => {
  it("maps a camelCase NewOpportunityInput plus userId to a snake_case insert row", () => {
    const row = newOpportunityToRow(
      {
        instagramUrl: "https://instagram.com/p/abc",
        captionText: "Auditions open",
        applicationLink: "https://example.com/apply",
        organizationName: "Test Co",
        deadline: "2026-09-01T00:00:00.000Z",
        performanceDate: "2026-10-01T00:00:00.000Z",
      },
      "22222222-2222-2222-2222-222222222222",
    );

    expect(row).toEqual({
      user_id: "22222222-2222-2222-2222-222222222222",
      instagram_url: "https://instagram.com/p/abc",
      caption_text: "Auditions open",
      application_link: "https://example.com/apply",
      organization_name: "Test Co",
      deadline: "2026-09-01T00:00:00.000Z",
      performance_date: "2026-10-01T00:00:00.000Z",
    });
  });

  it("defaults omitted optional text fields to empty strings and omitted dates to null", () => {
    const row = newOpportunityToRow(
      { instagramUrl: "https://instagram.com/p/abc" },
      "22222222-2222-2222-2222-222222222222",
    );

    expect(row).toEqual({
      user_id: "22222222-2222-2222-2222-222222222222",
      instagram_url: "https://instagram.com/p/abc",
      caption_text: "",
      application_link: "",
      organization_name: "",
      deadline: null,
      performance_date: null,
    });
  });
});
