import SwiftUI
import SwiftData

struct OpportunityDetailView: View {
    @Bindable var opportunity: Opportunity
    @State private var showingEditForm = false
    @State private var calendarError: String?
    @State private var calendarSuccess: String?

    var body: some View {
        List {
            Section("Status") {
                HStack {
                    StatusBadge(status: opportunity.status)
                    Spacer()
                    statusActionButtons
                }
            }

            Section("Details") {
                if !opportunity.organizationName.isEmpty {
                    LabeledContent("Organization", value: opportunity.organizationName)
                }
                if let deadline = opportunity.deadline {
                    LabeledContent("Deadline", value: deadline.formatted(date: .long, time: .omitted))
                }
                if let performanceDate = opportunity.performanceDate {
                    LabeledContent("Performance Date", value: performanceDate.formatted(date: .long, time: .omitted))
                }
            }

            if !opportunity.applicationLink.isEmpty, let url = URL(string: opportunity.applicationLink) {
                Section("Application") {
                    Link(destination: url) {
                        Label("Open Application Link", systemImage: "arrow.up.right.square")
                    }
                }
            }

            Section("Source") {
                if let url = URL(string: opportunity.instagramURL) {
                    Link(destination: url) {
                        Label("View Instagram Post", systemImage: "camera")
                    }
                }
            }

            if !opportunity.captionText.isEmpty {
                Section("Caption") {
                    Text(opportunity.captionText)
                        .font(.body)
                        .foregroundStyle(.secondary)
                }
            }

            Section("Calendar") {
                if opportunity.deadline != nil {
                    Button {
                        Task { await addDeadlineToCalendar() }
                    } label: {
                        Label("Add Deadline + Reminders", systemImage: "calendar.badge.plus")
                    }
                }
                if opportunity.performanceDate != nil, opportunity.status == .accepted {
                    Button {
                        Task { await addPerformanceToCalendar() }
                    } label: {
                        Label("Add Performance Date", systemImage: "calendar.badge.plus")
                    }
                }
            }
        }
        .navigationTitle(opportunity.organizationName.isEmpty ? "Opportunity" : opportunity.organizationName)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Edit") { showingEditForm = true }
            }
        }
        .sheet(isPresented: $showingEditForm) {
            OpportunityFormView(opportunity: opportunity)
        }
        .alert("Calendar Error", isPresented: Binding(get: { calendarError != nil }, set: { if !$0 { calendarError = nil } })) {
            Button("OK") { calendarError = nil }
        } message: {
            Text(calendarError ?? "")
        }
        .alert("Added to Calendar", isPresented: Binding(get: { calendarSuccess != nil }, set: { if !$0 { calendarSuccess = nil } })) {
            Button("OK") { calendarSuccess = nil }
        } message: {
            Text(calendarSuccess ?? "")
        }
    }

    @ViewBuilder
    private var statusActionButtons: some View {
        switch opportunity.status {
        case .discovered:
            Button("Mark Applied") { opportunity.status = .applied }
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
        case .applied:
            HStack(spacing: 8) {
                Button("Accepted") {
                    opportunity.status = .accepted
                    if opportunity.performanceDate != nil {
                        Task { try? await CalendarService.shared.addPerformanceEvent(for: opportunity) }
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
                .controlSize(.small)

                Button("Rejected") { opportunity.status = .rejected }
                    .buttonStyle(.borderedProminent)
                    .tint(.red)
                    .controlSize(.small)
            }
        case .accepted, .rejected:
            EmptyView()
        }
    }

    private func addDeadlineToCalendar() async {
        do {
            try await CalendarService.shared.addDeadlineEvent(for: opportunity)
            calendarSuccess = "Deadline added with reminders 3 days and 1 day before."
        } catch {
            calendarError = error.localizedDescription
        }
    }

    private func addPerformanceToCalendar() async {
        do {
            try await CalendarService.shared.addPerformanceEvent(for: opportunity)
            calendarSuccess = "Performance date added to your calendar."
        } catch {
            calendarError = error.localizedDescription
        }
    }
}
