import SwiftUI

struct ContentView: View {
    @Binding var pendingInstagramURL: URL?
    @State private var showingAddForm = false
    @State private var scrapedData: InstagramPostData?
    @State private var isScraping = false
    @State private var showingSettings = false

    var body: some View {
        NavigationStack {
            OpportunityListView()
                .navigationTitle("Opportunities")
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button { showingAddForm = true } label: {
                            Image(systemName: "plus")
                        }
                    }
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button { showingSettings = true } label: {
                            Image(systemName: "gear")
                        }
                    }
                }
        }
        .sheet(isPresented: $showingAddForm) {
            OpportunityFormView(
                instagramURL: pendingInstagramURL?.absoluteString ?? "",
                scrapedData: scrapedData,
                onDismiss: {
                    pendingInstagramURL = nil
                    scrapedData = nil
                }
            )
        }
        .sheet(isPresented: $showingSettings) {
            NavigationStack { SettingsView() }
        }
        .onChange(of: pendingInstagramURL) { _, url in
            guard let url else { return }
            Task { await scrape(url: url) }
        }
        .overlay {
            if isScraping {
                ProgressView("Fetching post details…")
                    .padding(20)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    private func scrape(url: URL) async {
        isScraping = true
        defer { isScraping = false }
        scrapedData = try? await ApifyService.shared.scrape(instagramURL: url)
        showingAddForm = true
    }
}
