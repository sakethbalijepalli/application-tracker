import { useState, type FormEvent } from "react";
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
  const [error, setError] = useState<string | null>(null);

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
    <form onSubmit={handleSubmit}>
      <h2>Add opportunity</h2>
      <label>
        Instagram URL
        <input
          type="url"
          required
          value={form.instagramUrl}
          onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
        />
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
        Caption
        <textarea
          value={form.captionText}
          onChange={(e) => setForm({ ...form, captionText: e.target.value })}
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
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add opportunity"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
