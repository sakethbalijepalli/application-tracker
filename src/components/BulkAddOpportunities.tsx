import { useState } from "react";
import { parseOpportunityUrls } from "../lib/parseOpportunityUrls";
import { scrapeOpportunityDetails } from "../lib/scrapeOpportunity";
import type { NewOpportunityInput } from "../models/opportunity";

interface BulkResult {
  url: string;
  status: "pending" | "fetching" | "added" | "failed";
  error?: string;
}

interface BulkAddOpportunitiesProps {
  onAdd: (input: NewOpportunityInput) => Promise<void>;
}

export function BulkAddOpportunities({ onAdd }: BulkAddOpportunitiesProps) {
  const [rawText, setRawText] = useState("");
  const [results, setResults] = useState<BulkResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const setStatus = (url: string, patch: Partial<BulkResult>) => {
    setResults((current) => current.map((r) => (r.url === url ? { ...r, ...patch } : r)));
  };

  const handleAddAll = async () => {
    const urls = parseOpportunityUrls(rawText);
    if (urls.length === 0) return;

    setIsProcessing(true);
    setResults(urls.map((url) => ({ url, status: "pending" })));

    // Sequential, not parallel — avoids hammering Apify/Vision with N simultaneous requests
    // and gives clean per-item progress feedback as each one completes.
    for (const url of urls) {
      setStatus(url, { status: "fetching" });
      try {
        const details = await scrapeOpportunityDetails(url);
        await onAdd({
          instagramUrl: url,
          captionText: details.captionText,
          organizationName: details.organizationName,
          applicationLink: details.applicationLink,
          deadline: details.deadline,
          performanceDate: details.performanceDate,
        });
        setStatus(url, { status: "added" });
      } catch (err) {
        setStatus(url, { status: "failed", error: err instanceof Error ? err.message : "Failed" });
      }
    }

    setIsProcessing(false);
    setRawText("");
  };

  return (
    <div className="bulk-add">
      <h2>Bulk add from links</h2>
      <textarea
        placeholder="Paste any number of links, one per line — Instagram posts or direct application pages"
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        rows={4}
      />
      <button
        type="button"
        className="btn btn-primary"
        disabled={isProcessing || !rawText.trim()}
        onClick={handleAddAll}
      >
        {isProcessing ? "Adding…" : "Add all"}
      </button>
      {results.length > 0 && (
        <ul className="bulk-add-results">
          {results.map((result) => (
            <li key={result.url} data-status={result.status}>
              <span className="bulk-add-url">{result.url}</span>
              <span className="bulk-add-status">
                {result.status === "pending" && "Queued"}
                {result.status === "fetching" && "Fetching…"}
                {result.status === "added" && "Added ✓"}
                {result.status === "failed" && `Failed: ${result.error}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
