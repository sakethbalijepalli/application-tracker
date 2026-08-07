import type { CalendarClient, SaveEventInput } from "./calendarClient";

export class FakeCalendarClient implements CalendarClient {
  savedEvents: SaveEventInput[] = [];
  deletedEventIds: string[] = [];
  private nextIdentifierNumber = 0;

  async saveEvent(input: SaveEventInput): Promise<string> {
    this.savedEvents.push(input);
    if (input.identifier) return input.identifier;
    this.nextIdentifierNumber += 1;
    return `event-${this.nextIdentifierNumber}`;
  }

  async deleteEvent(identifier: string): Promise<void> {
    this.deletedEventIds.push(identifier);
  }
}
