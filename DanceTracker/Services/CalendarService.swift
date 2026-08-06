import EventKit
import Foundation

actor CalendarService {
    static let shared = CalendarService()
    private let store = EKEventStore()

    func requestAccess() async throws -> Bool {
        try await store.requestWriteOnlyAccessToEvents()
    }

    func addDeadlineEvent(for opportunity: Opportunity) async throws {
        guard let deadline = opportunity.deadline else { return }
        guard try await requestAccess() else { throw CalendarError.accessDenied }

        let event = EKEvent(eventStore: store)
        event.title = "Application Deadline — \(opportunity.organizationName.isEmpty ? "Dance Opportunity" : opportunity.organizationName)"
        event.startDate = deadline
        event.endDate = deadline.addingTimeInterval(3600)
        event.calendar = store.defaultCalendarForNewEvents
        event.notes = opportunity.instagramURL
        event.addAlarm(EKAlarm(relativeOffset: -3 * 24 * 3600))
        event.addAlarm(EKAlarm(relativeOffset: -24 * 3600))

        try store.save(event, span: .thisEvent)
    }

    func addPerformanceEvent(for opportunity: Opportunity) async throws {
        guard let performanceDate = opportunity.performanceDate else { return }
        guard try await requestAccess() else { throw CalendarError.accessDenied }

        let event = EKEvent(eventStore: store)
        event.title = "Performance — \(opportunity.organizationName.isEmpty ? "Dance Event" : opportunity.organizationName)"
        event.startDate = performanceDate
        event.endDate = performanceDate.addingTimeInterval(7200)
        event.calendar = store.defaultCalendarForNewEvents
        event.notes = opportunity.instagramURL
        event.addAlarm(EKAlarm(relativeOffset: -24 * 3600))

        try store.save(event, span: .thisEvent)
    }

    enum CalendarError: LocalizedError {
        case accessDenied
        var errorDescription: String? { "Calendar access was denied. Enable it in Settings > Privacy & Security > Calendars." }
    }
}
