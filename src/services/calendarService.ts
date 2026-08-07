import type { Opportunity } from "../models/opportunity";
import type { CalendarClient } from "./calendarClient";

export class CalendarService {
  private readonly client: CalendarClient;

  constructor(client: CalendarClient) {
    this.client = client;
  }

  async syncDeadlineEvent(opportunity: Opportunity): Promise<Opportunity> {
    if (!opportunity.deadline) return opportunity;

    const startDate = new Date(opportunity.deadline);
    const deadlineEventId = await this.client.saveEvent({
      identifier: opportunity.deadlineEventId,
      title: `Application Deadline — ${opportunity.organizationName || "Dance Opportunity"}`,
      startDate,
      endDate: new Date(startDate.getTime() + 60 * 60 * 1000),
      notes: opportunity.instagramUrl,
      reminderMinutesBefore: [3 * 24 * 60, 24 * 60],
    });

    return { ...opportunity, deadlineEventId };
  }

  async syncPerformanceEvent(opportunity: Opportunity): Promise<Opportunity> {
    if (!opportunity.performanceDate) return opportunity;

    const startDate = new Date(opportunity.performanceDate);
    const performanceEventId = await this.client.saveEvent({
      identifier: opportunity.performanceEventId,
      title: `Performance — ${opportunity.organizationName || "Dance Event"}`,
      startDate,
      endDate: new Date(startDate.getTime() + 2 * 60 * 60 * 1000),
      notes: opportunity.instagramUrl,
      reminderMinutesBefore: [24 * 60],
    });

    return { ...opportunity, performanceEventId };
  }
}
