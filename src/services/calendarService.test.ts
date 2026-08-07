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
});
