import { useState, type FormEvent } from "react";
import { scrapeOpportunityDetails } from "../lib/scrapeOpportunity";
import type { NewOpportunityInput } from "../models/opportunity";

interface AddOpportunityFormProps {
  onSubmit: (input: NewOpportunityInput) => Promise<void>;
}

const emptyForm = {
  instagramUrl: "",
  captionText: "",
  applicationLink: "",
  organizationName: "",
  deadline: "",
  performanceDate: "",
};

export function AddOpportunityForm({ onSubmit }: AddOpportunityFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchDetails = async () => {
    if (!form.instagramUrl.trim()) return;

    setIsFetchingDetails(true);
    setError(null);
    try {
      const details = await scrapeOpportunityDetails(form.instagramUrl.trim());
      setForm((current) => ({
        ...current,
        captionText: details.captionText || current.captionText,
        organizationName: details.organizationName || current.organizationName,
        applicationLink: details.applicationLink || current.applicationLink,
        deadline: details.deadline || current.deadline,
        performanceDate: details.performanceDate || current.performanceDate,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch details from this link.");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.instagramUrl.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        instagramUrl: form.instagramUrl.trim(),
        captionText: form.captionText.trim(),
        applicationLink: form.applicationLink.trim(),
        organizationName: form.organizationName.trim(),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        performanceDate: form.performanceDate ? new Date(form.performanceDate).toISOString() : undefined,
      });
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add opportunity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="opportunity-form" onSubmit={handleSubmit}>
      <h2>Add opportunity</h2>
      <div className="form-grid">
        <label className="field-full">
          Link (Instagram post or application page)
          <div className="input-with-action">
            <input
              type="url"
              required
              placeholder="https://instagram.com/p/… or a direct application link"
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
            />
            <button
              type="button"
              className="btn btn-ghost"
              disabled={isFetchingDetails || !form.instagramUrl.trim()}
              onClick={handleFetchDetails}
            >
              {isFetchingDetails ? "Fetching…" : "Fetch details"}
            </button>
          </div>
        </label>
        <label>
          Organization
          <input
            type="text"
            value={form.organizationName}
            onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
          />
        </label>
        <label>
          Application link
          <input
            type="url"
            value={form.applicationLink}
            onChange={(e) => setForm({ ...form, applicationLink: e.target.value })}
          />
        </label>
        <label>
          Application deadline
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </label>
        <label>
          Performance date
          <input
            type="date"
            value={form.performanceDate}
            onChange={(e) => setForm({ ...form, performanceDate: e.target.value })}
          />
        </label>
        <label className="field-full">
          Caption
          <textarea
            value={form.captionText}
            onChange={(e) => setForm({ ...form, captionText: e.target.value })}
          />
        </label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add opportunity"}
      </button>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
