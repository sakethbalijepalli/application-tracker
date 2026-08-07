import type { Opportunity, OpportunityStatus } from "../models/opportunity";

const STATUSES: OpportunityStatus[] = ["discovered", "applied", "accepted", "rejected"];

interface OpportunityListProps {
  opportunities: Opportunity[];
  onStatusChange: (id: string, status: OpportunityStatus) => void;
  onDelete: (id: string) => void;
}

export function OpportunityList({ opportunities, onStatusChange, onDelete }: OpportunityListProps) {
  if (opportunities.length === 0) {
    return <p className="empty-state">No opportunities yet — add one above.</p>;
  }

  const handleDelete = (opportunity: Opportunity) => {
    const label = opportunity.organizationName || "this opportunity";
    if (window.confirm(`Delete ${label}? This can't be undone.`)) {
      onDelete(opportunity.id);
    }
  };

  return (
    <ul className="opportunity-list">
      {opportunities.map((opportunity) => (
        <li key={opportunity.id} className="opportunity-card" data-status={opportunity.status}>
          <div className="opportunity-card-header">
            <span className="opportunity-card-title">{opportunity.organizationName || "Untitled opportunity"}</span>
            <button
              type="button"
              className="delete-btn"
              aria-label={`Delete ${opportunity.organizationName || "this opportunity"}`}
              onClick={() => handleDelete(opportunity)}
            >
              ✕
            </button>
          </div>
          <a
            className="opportunity-card-link"
            href={opportunity.instagramUrl}
            target="_blank"
            rel="noreferrer"
          >
            View Instagram post ↗
          </a>
          <div className="opportunity-card-meta">
            {opportunity.deadline && <span>Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</span>}
            {opportunity.performanceDate && (
              <span>Performance: {new Date(opportunity.performanceDate).toLocaleDateString()}</span>
            )}
          </div>
          <div className="opportunity-card-footer">
            <label>
              Status
              <select
                className="status-select"
                data-status={opportunity.status}
                value={opportunity.status}
                onChange={(e) => onStatusChange(opportunity.id, e.target.value as OpportunityStatus)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </li>
      ))}
    </ul>
  );
}
