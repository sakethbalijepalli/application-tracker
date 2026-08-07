import type { Opportunity, OpportunityStatus } from "../models/opportunity";

const STATUSES: OpportunityStatus[] = ["discovered", "applied", "accepted", "rejected"];

interface OpportunityListProps {
  opportunities: Opportunity[];
  onStatusChange: (id: string, status: OpportunityStatus) => void;
}

export function OpportunityList({ opportunities, onStatusChange }: OpportunityListProps) {
  if (opportunities.length === 0) {
    return <p>No opportunities yet — add one above.</p>;
  }

  return (
    <ul>
      {opportunities.map((opportunity) => (
        <li key={opportunity.id}>
          <strong>{opportunity.organizationName || "Untitled opportunity"}</strong>
          <div>
            <a href={opportunity.instagramUrl} target="_blank" rel="noreferrer">
              Instagram post
            </a>
          </div>
          {opportunity.deadline && <div>Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</div>}
          {opportunity.performanceDate && (
            <div>Performance: {new Date(opportunity.performanceDate).toLocaleDateString()}</div>
          )}
          <label>
            Status
            <select
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
        </li>
      ))}
    </ul>
  );
}
