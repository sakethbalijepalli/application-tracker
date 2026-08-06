import SwiftUI
import SwiftData

@main
struct DanceTrackerApp: App {
    @State private var pendingInstagramURL: URL?

    private let sharedDefaults = UserDefaults(suiteName: "group.com.sakethbalijepalli.DanceTracker")

    var body: some Scene {
        WindowGroup {
            ContentView(pendingInstagramURL: $pendingInstagramURL)
                .modelContainer(for: Opportunity.self)
                .onAppear { checkPendingURL() }
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)) { _ in
                    checkPendingURL()
                }
        }
    }

    private func checkPendingURL() {
        guard let urlString = sharedDefaults?.string(forKey: "pendingInstagramURL"),
              let url = URL(string: urlString) else { return }
        sharedDefaults?.removeObject(forKey: "pendingInstagramURL")
        pendingInstagramURL = url
    }
}
