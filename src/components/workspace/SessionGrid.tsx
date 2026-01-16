import { useMemo, useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { SessionCard } from './SessionCard';
import type { Session } from '../../types';

interface SessionGridProps {
  sessions: Session[];
}

export function SessionGrid({ sessions }: SessionGridProps) {
  const { selectSession } = useSessionStore();
  const [showCompleted, setShowCompleted] = useState(false);

  // Filter sessions based on status
  const filteredSessions = useMemo(() => {
    if (showCompleted) return sessions;
    return sessions.filter(s => s.status !== 'completed');
  }, [sessions, showCompleted]);

  // Count sessions by status
  const statusCounts = useMemo(() => {
    return sessions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [sessions]);

  // Group by workspace for the grid view
  const workspaceGroups = useMemo(() => {
    const groups = new Map<string, { name: string; sessions: Session[] }>();

    for (const session of filteredSessions) {
      const existing = groups.get(session.workspaceId);
      if (existing) {
        existing.sessions.push(session);
      } else {
        groups.set(session.workspaceId, {
          name: session.workspaceName,
          sessions: [session],
        });
      }
    }

    return Array.from(groups.entries());
  }, [filteredSessions]);

  if (sessions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-hq-border/50 flex items-center justify-center">
            <EmptyIcon />
          </div>
          <h2 className="text-xl font-semibold text-hq-text mb-2">
            No Sessions Found
          </h2>
          <p className="text-hq-text-muted">
            Start a Claude Code session in your terminal or Cursor to see it here.
            Sessions are automatically discovered from your ~/.claude directory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Filter bar */}
        <div className="flex items-center justify-between p-4 bg-hq-surface border border-hq-border rounded-lg">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-hq-text-muted">Total:</span>
              <span className="text-lg font-semibold text-hq-text">{sessions.length}</span>
            </div>
            {statusCounts.active > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-hq-success animate-pulse" />
                <span className="text-sm text-hq-success">{statusCounts.active} active</span>
              </div>
            )}
            {statusCounts.idle > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-hq-warning" />
                <span className="text-sm text-hq-warning">{statusCounts.idle} idle</span>
              </div>
            )}
            {statusCounts.completed > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-hq-text-muted" />
                <span className="text-sm text-hq-text-muted">{statusCounts.completed} completed</span>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 rounded border-hq-border bg-hq-bg"
            />
            <span className="text-sm text-hq-text">Show completed sessions</span>
          </label>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-hq-text-muted">
              No active or idle sessions to display
            </p>
          </div>
        ) : (
          workspaceGroups.map(([workspaceId, group]) => (
            <div key={workspaceId}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-hq-border flex items-center justify-center">
                  <FolderIcon />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-hq-text">
                    {group.name}
                  </h2>
                  <p className="text-sm text-hq-text-muted">
                    {group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onClick={() => selectSession(session.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-hq-text-muted"
    >
      <rect x="4" y="6" width="24" height="20" rx="2" />
      <path d="M4 12h24" />
      <circle cx="8" cy="9" r="1" fill="currentColor" />
      <circle cx="12" cy="9" r="1" fill="currentColor" />
      <circle cx="16" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-hq-accent"
    >
      <path d="M2 4v8a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1H8L6 3H3a1 1 0 00-1 1z" />
    </svg>
  );
}
