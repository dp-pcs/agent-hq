import { StatusIndicator } from '../shared/StatusIndicator';
import { AgentAvatar } from '../shared/AgentAvatar';
import type { Session } from '../../types';

interface SessionCardProps {
  session: Session;
  onClick: () => void;
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  const timeAgo = getTimeAgo(new Date(session.lastMessageAt));

  // Get the last text message for preview
  const lastMessage = session.messages
    .slice()
    .reverse()
    .find((m) => m.content.some((c) => c.type === 'text'));

  const previewText = lastMessage?.content.find((c) => c.type === 'text')?.text;
  const truncatedPreview = previewText
    ? previewText.slice(0, 150) + (previewText.length > 150 ? '...' : '')
    : 'No messages yet';

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-hq-surface border border-hq-border rounded-lg hover:border-hq-accent/50 hover:bg-hq-surface/80 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIndicator status={session.status} size="md" />
          <span className="text-sm font-medium text-hq-text capitalize">
            {session.status}
          </span>
        </div>
        <span className="text-xs text-hq-text-muted">{timeAgo}</span>
      </div>

      {/* Session ID */}
      <div className="mb-2">
        <span className="text-xs font-mono text-hq-text-muted">
          {session.id.slice(0, 8)}...
        </span>
      </div>

      {/* Preview */}
      <p className="text-sm text-hq-text-muted line-clamp-2 mb-3 min-h-[2.5rem]">
        {truncatedPreview}
      </p>

      {/* Agents */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {session.agents.slice(0, 4).map((agent, i) => (
            <AgentAvatar
              key={agent.id}
              agent={agent}
              size="sm"
              style={{ marginLeft: i > 0 ? '-8px' : '0', zIndex: 4 - i }}
            />
          ))}
          {session.agents.length > 4 && (
            <span className="ml-1 text-xs text-hq-text-muted">
              +{session.agents.length - 4}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-hq-text-muted">
          <MessageIcon />
          <span>{session.messages.length}</span>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="mt-3 pt-3 border-t border-hq-border opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-hq-accent flex items-center gap-1">
          Open chat
          <ArrowIcon />
        </span>
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

function MessageIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 3h8v5a1 1 0 01-1 1H5L3 11V9H3a1 1 0 01-1-1V3z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 6h8M7 3l3 3-3 3" />
    </svg>
  );
}
