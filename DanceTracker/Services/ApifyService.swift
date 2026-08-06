import Foundation

struct InstagramPostData {
    let caption: String
    let applicationLink: String
    let inferredDeadline: Date?
    let inferredPerformanceDate: Date?
}

actor ApifyService {
    static let shared = ApifyService()

    private var apiKey: String {
        UserDefaults.standard.string(forKey: "apifyAPIKey") ?? ""
    }

    func scrape(instagramURL: URL) async throws -> InstagramPostData {
        guard !apiKey.isEmpty else { throw ApifyError.missingAPIKey }

        var components = URLComponents(string: "https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items")!
        components.queryItems = [
            URLQueryItem(name: "token", value: apiKey),
            URLQueryItem(name: "timeout", value: "60")
        ]

        var request = URLRequest(url: components.url!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "directUrls": [instagramURL.absoluteString],
            "resultsType": "posts",
            "resultsLimit": 1
        ])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw ApifyError.requestFailed
        }

        guard let posts = try JSONSerialization.jsonObject(with: data) as? [[String: Any]],
              let post = posts.first else {
            throw ApifyError.noData
        }

        let caption = post["caption"] as? String ?? ""
        let bioLink = post["externalUrl"] as? String ?? ""

        return InstagramPostData(
            caption: caption,
            applicationLink: bioLink,
            inferredDeadline: parseDate(from: caption),
            inferredPerformanceDate: nil
        )
    }

    private func parseDate(from text: String) -> Date? {
        let patterns = [
            "(?:deadline|apply by|due|closes?)\\s*[:\\-]?\\s*(\\w+ \\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?)",
            "(?:deadline|apply by|due|closes?)\\s*[:\\-]?\\s*(\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{2,4})"
        ]

        let formatters: [DateFormatter] = {
            var result: [DateFormatter] = []
            for format in ["MMMM d, yyyy", "MMMM d yyyy", "MMMM dyyyy", "MM/dd/yyyy", "MM/dd/yy", "MM-dd-yyyy"] {
                let f = DateFormatter()
                f.dateFormat = format
                f.locale = Locale(identifier: "en_US")
                result.append(f)
            }
            return result
        }()

        let lowercased = text.lowercased()
        for pattern in patterns {
            guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
                  let match = regex.firstMatch(in: lowercased, range: NSRange(lowercased.startIndex..., in: lowercased)),
                  let range = Range(match.range(at: 1), in: lowercased) else { continue }

            let dateString = String(lowercased[range])
                .trimmingCharacters(in: .whitespaces)
                .replacingOccurrences(of: #"(\d+)(st|nd|rd|th)"#, with: "$1", options: .regularExpression)

            for formatter in formatters {
                if let date = formatter.date(from: dateString) {
                    return date
                }
            }
        }
        return nil
    }

    enum ApifyError: LocalizedError {
        case missingAPIKey, requestFailed, noData

        var errorDescription: String? {
            switch self {
            case .missingAPIKey: "Apify API key not configured. Add it in Settings."
            case .requestFailed: "Failed to fetch Instagram post data."
            case .noData: "No data returned for this Instagram URL."
            }
        }
    }
}
