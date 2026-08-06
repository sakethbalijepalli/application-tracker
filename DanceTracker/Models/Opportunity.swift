import SwiftData
import Foundation

enum OpportunityStatus: String, Codable, CaseIterable {
    case discovered = "Discovered"
    case applied = "Applied"
    case accepted = "Accepted"
    case rejected = "Rejected"
}

@Model
final class Opportunity {
    var id: UUID
    var instagramURL: String
    var captionText: String
    var applicationLink: String
    var organizationName: String
    var deadline: Date?
    var performanceDate: Date?
    var status: OpportunityStatus
    var createdAt: Date

    init(
        instagramURL: String,
        captionText: String = "",
        applicationLink: String = "",
        organizationName: String = "",
        deadline: Date? = nil,
        performanceDate: Date? = nil
    ) {
        self.id = UUID()
        self.instagramURL = instagramURL
        self.captionText = captionText
        self.applicationLink = applicationLink
        self.organizationName = organizationName
        self.deadline = deadline
        self.performanceDate = performanceDate
        self.status = .discovered
        self.createdAt = Date()
    }
}
