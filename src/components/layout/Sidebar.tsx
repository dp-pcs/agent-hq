import { useMemo, useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { StatusIndicator } from '../shared/StatusIndicator';
import type { Session } from '../../types';

export function Sidebar() {
  const { sessions, selectedSessionId, selectSession, isLoading } =
    useSessionStore();
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set()
  );

  // Group sessions by workspace
  const workspaceGroups = useMemo(() => {
    const groups = new Map<string, { name: string; sessions: Session[] }>();

    for (const session of sessions) {
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

    // Sort sessions within each workspace by last activity
    for (const group of groups.values()) {
      group.sessions.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      );
    }

    return groups;
  }, [sessions]);

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
      }
      return next;
    });
  };

  // Expand workspace when its session is selected
  useMemo(() => {
    if (selectedSessionId) {
      const session = sessions.find((s) => s.id === selectedSessionId);
      if (session && !expandedWorkspaces.has(session.workspaceId)) {
        setExpandedWorkspaces((prev) => new Set([...prev, session.workspaceId]));
      }
    }
  }, [selectedSessionId, sessions]);

  return (
    <div className="w-64 bg-hq-surface border-r border-hq-border flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-hq-border">
        <h2 className="text-sm font-semibold text-hq-text-muted uppercase tracking-wide">
          Workspaces
        </h2>
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin-slow">
              <SpinnerIcon />
            </div>
          </div>
        ) : workspaceGroups.size === 0 ? (
          <div className="text-center py-8 text-hq-text-muted text-sm">
            <p>No sessions found</p>
            <p className="mt-1 text-xs">
              Start a Claude Code session to see it here
            </p>
          </div>
        ) : (
          Array.from(workspaceGroups.entries()).map(([workspaceId, group]) => (
            <WorkspaceGroup
              key={workspaceId}
              workspaceId={workspaceId}
              name={group.name}
              sessions={group.sessions}
              isExpanded={expandedWorkspaces.has(workspaceId)}
              onToggle={() => toggleWorkspace(workspaceId)}
              selectedSessionId={selectedSessionId}
              onSelectSession={selectSession}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-hq-border">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-hq-border/50 hover:bg-hq-border rounded-lg text-sm text-hq-text-muted hover:text-hq-text transition-colors">
          <PlusIcon />
          <span>Add Workspace</span>
        </button>
      </div>
    </div>
  );
}

interface WorkspaceGroupProps {
  workspaceId: string;
  name: string;
  sessions: Session[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedSessionId: string | null;
  onSelectSession: (id: string | null) => void;
}

function WorkspaceGroup({
  workspaceId,
  name,
  sessions,
  isExpanded,
  onToggle,
  selectedSessionId,
  onSelectSession,
}: WorkspaceGroupProps) {
  const activeCount = sessions.filter((s) => s.status === 'active').length;

  return (
    <div className="mb-1">
      {/* Workspace header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-hq-border/50 transition-colors group"
      >
        <ChevronIcon isExpanded={isExpanded} />
        <FolderIcon />
        <span className="flex-1 text-left text-sm font-medium truncate">
          {name}
        </span>
        {activeCount > 0 && (
          <span className="px-1.5 py-0.5 bg-hq-success/20 text-hq-success text-xs rounded">
            {activeCount}
          </span>
        )}
      </button>

      {/* Sessions */}
      {isExpanded && (
        <div className="ml-4 mt-1 space-y-0.5">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isSelected={session.id === selectedSessionId}
              onSelect={() => onSelectSession(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SessionItemProps {
  session: Session;
  isSelected: boolean;
  onSelect: () => void;
}

function SessionItem({ session, isSelected, onSelect }: SessionItemProps) {
  const timeAgo = getTimeAgo(new Date(session.lastMessageAt));
  const agentCount = session.agents.length;

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
        isSelected
          ? 'bg-hq-accent/20 text-hq-accent'
          : 'hover:bg-hq-border/50 text-hq-text-muted hover:text-hq-text'
      }`}
    >
      <StatusIndicator status={session.status} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">
          {session.currentTask || `Session ${session.id.slice(0, 8)}`}
        </div>
        <div className="text-xs text-hq-text-muted flex items-center gap-1">
          <span>{agentCount} agent{agentCount !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </button>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
    >
      <path d="M6 4l4 4-4 4" />
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
    >
      <path d="M2 4v8a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1H8L6 3H3a1 1 0 00-1 1z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-hq-accent"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
