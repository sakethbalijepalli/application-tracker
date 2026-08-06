import SwiftUI
import SwiftData

struct OpportunityListView: View {
    @Query(sort: \Opportunity.createdAt, order: .reverse) private var opportunities: [Opportunity]
    @State private var filterStatus: OpportunityStatus?

    var filtered: [Opportunity] {
        guard let status = filterStatus else { return opportunities }
        return opportunities.filter { $0.status == status }
    }

    var body: some View {
        Group {
            if opportunities.isEmpty {
                ContentUnavailableView(
                    "No Opportunities Yet",
                    systemImage: "sparkles",
                    description: Text("Share an Instagram post to add one, or tap + to add manually.")
                )
            } else {
                List {
                    ForEach(filtered) { opportunity in
                        NavigationLink(destination: OpportunityDetailView(opportunity: opportunity)) {
                            OpportunityRowView(opportunity: opportunity)
                        }
                    }
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Menu {
                    Button("All") { filterStatus = nil }
                    ForEach(OpportunityStatus.allCases, id: \.self) { status in
                        Button(status.rawValue) { filterStatus = status }
                    }
                } label: {
                    Label(filterStatus?.rawValue ?? "All", systemImage: "line.3.horizontal.decrease.circle")
                }
            }
        }
    }
}

struct OpportunityRowView: View {
    let opportunity: Opportunity

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(opportunity.organizationName.isEmpty ? "Unnamed Opportunity" : opportunity.organizationName)
                    .font(.headline)
                Spacer()
                StatusBadge(status: opportunity.status)
            }
            if let deadline = opportunity.deadline {
                Label(deadline.formatted(date: .abbreviated, time: .omitted), systemImage: "calendar")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}

struct StatusBadge: View {
    let status: OpportunityStatus

    var color: Color {
        switch status {
        case .discovered: .blue
        case .applied: .orange
        case .accepted: .green
        case .rejected: .red
        }
    }

    var body: some View {
        Text(status.rawValue)
            .font(.caption2)
            .fontWeight(.semibold)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.15))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}
