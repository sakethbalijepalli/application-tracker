import { useState } from "react";
import { normalizeUrlForComparison, parseOpportunityUrls } from "../lib/parseOpportunityUrls";
import { scrapeOpportunityDetails } from "../lib/scrapeOpportunity";
import type { NewOpportunityInput } from "../models/opportunity";
import { DuplicateOpportunityError } from "../services/opportunityStore";

interface BulkResult {
  url: string;
  status: "pending" | "fetching" | "added" | "failed" | "already-added";
  error?: string;
}

interface BulkAddOpportunitiesProps {
  existingUrls: Set<string>;
  onAdd: (input: NewOpportunityInput) => Promise<void>;
}

export function BulkAddOpportunities({ existingUrls, onAdd }: BulkAddOpportunitiesProps) {
  const [rawText, setRawText] = useState("");
  const [results, setResults] = useState<BulkResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const setStatus = (url: string, patch: Partial<BulkResult>) => {
    setResults((current) => current.map((r) => (r.url === url ? { ...r, ...patch } : r)));
  };

  const handleAddAll = async () => {
    const urls = parseOpportunityUrls(rawText);
    if (urls.length === 0) return;

    // Same link shared twice often carries different tracking params (utm_*, Instagram's igsh
    // share token) — compare normalized forms so those still count as "already tracked".
    const normalizedExistingUrls = new Set([...existingUrls].map(normalizeUrlForComparison));
    const isAlreadyAdded = (url: string) => normalizedExistingUrls.has(normalizeUrlForComparison(url));

    setIsProcessing(true);
    setResults(urls.map((url) => ({ url, status: isAlreadyAdded(url) ? "already-added" : "pending" })));

    // Sequential, not parallel — avoids hammering Apify/Vision with N simultaneous requests
    // and gives clean per-item progress feedback as each one completes.
    for (const url of urls) {
      // Already-tracked links are skipped before ever scraping — no point spending an Apify/OCR
      // call to re-derive details for a link that's already an opportunity in the list.
      if (isAlreadyAdded(url)) continue;

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
        // Caught here, one step later than the existingUrls pre-check: that check only knows
        // about opportunities loaded before this batch started, so a same-batch duplicate (e.g.
        // two different links that scrape to the same org + dates) reaches store.add() and
        // throws this instead — same "already tracked" outcome, just discovered after scraping.
        if (err instanceof DuplicateOpportunityError) {
          setStatus(url, { status: "already-added" });
        } else {
          setStatus(url, { status: "failed", error: err instanceof Error ? err.message : "Failed" });
        }
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
                {result.status === "already-added" && "Already added — skipped"}
                {result.status === "failed" && `Failed: ${result.error}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
