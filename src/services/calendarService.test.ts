import { describe, expect, it } from "vitest";
import { createOpportunity } from "../models/opportunity";
import { FakeCalendarClient } from "./calendarClient.fake";
import { CalendarService } from "./calendarService";

describe("CalendarService", () => {
  it("re-syncing the same opportunity's deadline updates the existing event instead of duplicating", async () => {
    const client = new FakeCalendarClient();
    const service = new CalendarService(client);
    let opportunity = createOpportunity({
      instagramUrl: "https://instagram.com/p/abc",
      organizationName: "Test Co",
      deadline: new Date().toISOString(),
    });

    opportunity = await service.syncDeadlineEvent(opportunity);
    opportunity = await service.syncDeadlineEvent(opportunity);

    expect(client.savedEvents).toHaveLength(2);
    expect(client.savedEvents[0].identifier).toBeUndefined();
    expect(client.savedEvents[1].identifier).toBe("event-1");
    expect(opportunity.deadlineEventId).toBe("event-1");
  });

  it("re-syncing the same opportunity's performance date updates the existing event instead of duplicating", async () => {
    const client = new FakeCalendarClient();
    const service = new CalendarService(client);
    let opportunity = createOpportunity({
      instagramUrl: "https://instagram.com/p/abc",
      organizationName: "Test Co",
      performanceDate: new Date().toISOString(),
    });

    opportunity = await service.syncPerformanceEvent(opportunity);
    opportunity = await service.syncPerformanceEvent(opportunity);

    expect(client.savedEvents).toHaveLength(2);
    expect(client.savedEvents[0].identifier).toBeUndefined();
    expect(client.savedEvents[1].identifier).toBe("event-1");
    expect(opportunity.performanceEventId).toBe("event-1");
  });

  it("deleteDeadlineEvent deletes the synced deadline event via the client", async () => {
    const client = new FakeCalendarClient();
    const service = new CalendarService(client);
    const opportunity = createOpportunity({
      instagramUrl: "https://instagram.com/p/abc",
      deadline: new Date().toISOString(),
    });
    opportunity.deadlineEventId = "event-1";

    await service.deleteDeadlineEvent(opportunity);

    expect(client.deletedEventIds).toEqual(["event-1"]);
  });

  it("deleteDeadlineEvent is a no-op when the opportunity was never synced to the calendar", async () => {
    const client = new FakeCalendarClient();
    const service = new CalendarService(client);
    const opportunity = createOpportunity({ instagramUrl: "https://instagram.com/p/abc" });

    await service.deleteDeadlineEvent(opportunity);

    expect(client.deletedEventIds).toEqual([]);
  });

  it("deletePerformanceEvent deletes the synced performance event via the client", async () => {
    const client = new FakeCalendarClient();
    const service = new CalendarService(client);
    const opportunity = createOpportunity({
      instagramUrl: "https://instagram.com/p/abc",
      performanceDate: new Date().toISOString(),
    });
    opportunity.performanceEventId = "event-2";

    await service.deletePerformanceEvent(opportunity);

    expect(client.deletedEventIds).toEqual(["event-2"]);
  });

  it("deletePerformanceEvent is a no-op when the opportunity was never synced to the calendar", async () => {
    const client = new FakeCalendarClient();
    const service = new CalendarService(client);
    const opportunity = createOpportunity({ instagramUrl: "https://instagram.com/p/abc" });

    await service.deletePerformanceEvent(opportunity);

    expect(client.deletedEventIds).toEqual([]);
  });
});
