import UIKit
import UniformTypeIdentifiers

final class ShareViewController: UIViewController {

    private let sharedDefaults = UserDefaults(suiteName: "group.com.sakethbalijepalli.DanceTracker")

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        extractAndSaveURL()
    }

    private func extractAndSaveURL() {
        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else {
            complete()
            return
        }

        for item in items {
            for provider in item.attachments ?? [] {
                if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] data, _ in
                        DispatchQueue.main.async {
                            if let url = data as? URL {
                                self?.save(url: url)
                            } else {
                                self?.complete()
                            }
                        }
                    }
                    return
                } else if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) { [weak self] data, _ in
                        DispatchQueue.main.async {
                            if let text = data as? String, let url = URL(string: text) {
                                self?.save(url: url)
                            } else {
                                self?.complete()
                            }
                        }
                    }
                    return
                }
            }
        }
        complete()
    }

    private func save(url: URL) {
        sharedDefaults?.set(url.absoluteString, forKey: "pendingInstagramURL")
        complete()
    }

    private func complete() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
