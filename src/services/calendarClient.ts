export interface SaveEventInput {
  /** Existing calendar event id to update, or undefined to create a new event. */
  identifier?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  /** Minutes before startDate to fire each reminder. */
  reminderMinutesBefore: number[];
}

export interface CalendarClient {
  /** Creates a new event when identifier is undefined, or updates the existing event. Returns the saved event's id. */
  saveEvent(input: SaveEventInput): Promise<string>;
  /** Deletes an existing event. Treats an already-deleted/missing event as success rather than
   * an error, since the caller's goal ("this event should not exist") is already satisfied. */
  deleteEvent(identifier: string): Promise<void>;
}
