import type { Opportunity, OpportunityStatus } from "../models/opportunity";

const STATUSES: OpportunityStatus[] = ["discovered", "applied", "accepted", "rejected"];

// Mirrors App.tsx's handleStatusChange: applied/accepted delete the deadline event only,
// rejected deletes both. Each is a real, hard-to-reverse action against Google Calendar, not
// just a local status flip — confirming first catches the common slip (wrong option in the
// status dropdown) before anything is actually deleted.
const CALENDAR_KINDS_CLEARED_BY_STATUS: Partial<Record<OpportunityStatus, ("deadline" | "performance")[]>> = {
  applied: ["deadline"],
  accepted: ["deadline"],
  rejected: ["deadline", "performance"],
};

/** Deadlines/performance dates are stored as UTC-midnight-anchored date-only values —
 * formatting in the viewer's local timezone would shift the displayed day (e.g. "2026-11-01"
 * renders as Oct 31 in US timezones), so this always reads the date in UTC instead. */
function formatDateOnly(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export type SyncKind = "deadline" | "performance";

interface OpportunityListProps {
  opportunities: Opportunity[];
  onStatusChange: (id: string, status: OpportunityStatus) => void;
  onDelete: (id: string) => void;
  onSync: (id: string, kind: SyncKind) => void;
  syncingKey: string | null;
}

export function OpportunityList({ opportunities, onStatusChange, onDelete, onSync, syncingKey }: OpportunityListProps) {
  if (opportunities.length === 0) {
    return <p className="empty-state">No opportunities yet — add one above.</p>;
  }

  const handleDelete = (opportunity: Opportunity) => {
    const label = opportunity.organizationName || "this opportunity";
    if (window.confirm(`Delete ${label}? This can't be undone.`)) {
      onDelete(opportunity.id);
    }
  };

  const handleStatusChange = (opportunity: Opportunity, status: OpportunityStatus) => {
    const clearedKinds = CALENDAR_KINDS_CLEARED_BY_STATUS[status] ?? [];
    const willDeleteDeadline = clearedKinds.includes("deadline") && Boolean(opportunity.deadlineEventId);
    const willDeletePerformance = clearedKinds.includes("performance") && Boolean(opportunity.performanceEventId);

    if (willDeleteDeadline || willDeletePerformance) {
      const label = opportunity.organizationName || "this opportunity";
      const eventWord =
        willDeleteDeadline && willDeletePerformance
          ? "deadline and performance reminders"
          : willDeleteDeadline
            ? "deadline reminder"
            : "performance reminder";
      if (!window.confirm(`Marking ${label} as ${status} will remove its ${eventWord} from your calendar. Continue?`)) {
        return;
      }
    }
    onStatusChange(opportunity.id, status);
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
          {opportunity.applicationLink && opportunity.status !== "accepted" && (
            <a
              className="opportunity-card-link"
              href={opportunity.applicationLink}
              target="_blank"
              rel="noreferrer"
            >
              Application link ↗
            </a>
          )}
          <div className="opportunity-card-meta">
            {opportunity.deadline && (
              <div className="sync-row">
                <span>Deadline: {formatDateOnly(opportunity.deadline)}</span>
                <button
                  type="button"
                  className="sync-btn"
                  disabled={syncingKey === `${opportunity.id}-deadline`}
                  onClick={() => onSync(opportunity.id, "deadline")}
                >
                  {syncingKey === `${opportunity.id}-deadline`
                    ? "Syncing…"
                    : opportunity.deadlineEventId
                      ? "Synced ✓"
                      : "Sync"}
                </button>
              </div>
            )}
            {opportunity.performanceDate && (
              <div className="sync-row">
                <span>Performance: {formatDateOnly(opportunity.performanceDate)}</span>
                <button
                  type="button"
                  className="sync-btn"
                  disabled={syncingKey === `${opportunity.id}-performance`}
                  onClick={() => onSync(opportunity.id, "performance")}
                >
                  {syncingKey === `${opportunity.id}-performance`
                    ? "Syncing…"
                    : opportunity.performanceEventId
                      ? "Synced ✓"
                      : "Sync"}
                </button>
              </div>
            )}
          </div>
          <div className="opportunity-card-footer">
            <label>
              Status
              <select
                className="status-select"
                data-status={opportunity.status}
                value={opportunity.status}
                onChange={(e) => handleStatusChange(opportunity, e.target.value as OpportunityStatus)}
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
