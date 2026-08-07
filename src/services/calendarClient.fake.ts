import type { CalendarClient, SaveEventInput } from "./calendarClient";

export class FakeCalendarClient implements CalendarClient {
  savedEvents: SaveEventInput[] = [];
  private nextIdentifierNumber = 0;

  async saveEvent(input: SaveEventInput): Promise<string> {
    this.savedEvents.push(input);
    if (input.identifier) return input.identifier;
    this.nextIdentifierNumber += 1;
    return `event-${this.nextIdentifierNumber}`;
  }
}
