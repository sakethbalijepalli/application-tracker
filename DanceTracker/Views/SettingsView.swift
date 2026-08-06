import SwiftUI

struct SettingsView: View {
    @AppStorage("apifyAPIKey") private var apiKey = ""

    var body: some View {
        Form {
            Section {
                SecureField("Apify API Key", text: $apiKey)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
            } header: {
                Text("Instagram Scraping")
            } footer: {
                Text("Get your free API key at apify.com. Required to auto-fill opportunity details when sharing from Instagram.")
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
    }
}
