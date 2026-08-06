import SwiftUI
import SwiftData

struct OpportunityFormView: View {
    // For new opportunity from share sheet
    var instagramURL: String = ""
    var scrapedData: InstagramPostData? = nil
    var onDismiss: (() -> Void)? = nil

    // For editing existing
    var opportunity: Opportunity? = nil

    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var orgName = ""
    @State private var caption = ""
    @State private var appLink = ""
    @State private var igURL = ""
    @State private var deadline = Date()
    @State private var hasDeadline = false
    @State private var performanceDate = Date()
    @State private var hasPerformanceDate = false

    private var isEditing: Bool { opportunity != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section("Organization") {
                    TextField("Name of studio, company, or event", text: $orgName)
                }

                Section("Application") {
                    TextField("Application link (Google Form, Doc, etc.)", text: $appLink)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }

                Section("Dates") {
                    Toggle("Has Deadline", isOn: $hasDeadline)
                    if hasDeadline {
                        DatePicker("Deadline", selection: $deadline, displayedComponents: .date)
                    }
                    Toggle("Has Performance Date", isOn: $hasPerformanceDate)
                    if hasPerformanceDate {
                        DatePicker("Performance Date", selection: $performanceDate, displayedComponents: .date)
                    }
                }

                Section("Source") {
                    TextField("Instagram post URL", text: $igURL)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }

                if !caption.isEmpty {
                    Section("Caption (from Instagram)") {
                        Text(caption)
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle(isEditing ? "Edit Opportunity" : "New Opportunity")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        onDismiss?()
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        save()
                        onDismiss?()
                        dismiss()
                    }
                    .disabled(igURL.isEmpty)
                }
            }
        }
        .onAppear { populate() }
    }

    private func populate() {
        if let opp = opportunity {
            orgName = opp.organizationName
            caption = opp.captionText
            appLink = opp.applicationLink
            igURL = opp.instagramURL
            if let d = opp.deadline { deadline = d; hasDeadline = true }
            if let p = opp.performanceDate { performanceDate = p; hasPerformanceDate = true }
        } else {
            igURL = instagramURL
            if let data = scrapedData {
                caption = data.caption
                appLink = data.applicationLink
                if let d = data.inferredDeadline { deadline = d; hasDeadline = true }
                if let p = data.inferredPerformanceDate { performanceDate = p; hasPerformanceDate = true }
            }
        }
    }

    private func save() {
        if let opp = opportunity {
            opp.organizationName = orgName
            opp.captionText = caption
            opp.applicationLink = appLink
            opp.instagramURL = igURL
            opp.deadline = hasDeadline ? deadline : nil
            opp.performanceDate = hasPerformanceDate ? performanceDate : nil
        } else {
            let opp = Opportunity(
                instagramURL: igURL,
                captionText: caption,
                applicationLink: appLink,
                organizationName: orgName,
                deadline: hasDeadline ? deadline : nil,
                performanceDate: hasPerformanceDate ? performanceDate : nil
            )
            modelContext.insert(opp)
            if hasDeadline {
                Task { try? await CalendarService.shared.addDeadlineEvent(for: opp) }
            }
        }
    }
}
