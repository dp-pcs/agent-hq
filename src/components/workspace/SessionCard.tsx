import { StatusIndicator } from '../shared/StatusIndicator';
import { AgentAvatar } from '../shared/AgentAvatar';
import type { Session } from '../../types';

interface SessionCardProps {
  session: Session;
  onClick: () => void;
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  const timeAgo = getTimeAgo(new Date(session.lastMessageAt));

  // Count agent statuses
  const agentStats = session.agents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get the last user message for context
  const lastUserMessage = session.messages
    .slice()
    .reverse()
    .find((m) => m.role === 'user' && m.content.some((c) => c.type === 'text'));

  const lastText = lastUserMessage?.content.find((c) => c.type === 'text');
  const summary = lastText && 'text' in lastText
    ? lastText.text.slice(0, 120) + (lastText.text.length > 120 ? '...' : '')
    : session.currentTask || 'No recent activity';

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 bg-hq-surface border border-hq-border rounded-lg hover:border-hq-accent/50 hover:bg-hq-surface/80 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <StatusIndicator status={session.status} size="md" />
          <div>
            <span className="text-base font-semibold text-hq-text">
              {session.workspaceName}
            </span>
            <div className="text-xs font-mono text-hq-text-muted mt-0.5">
              {session.id.slice(0, 8)}...
            </div>
          </div>
        </div>
        <span className="text-xs text-hq-text-muted">{timeAgo}</span>
      </div>

      {/* Summary */}
      <p className="text-sm text-hq-text mb-4 line-clamp-2 min-h-[2.5rem]">
        {summary}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-hq-border">
        {/* Agents */}
        <div className="flex flex-col">
          <span className="text-xs text-hq-text-muted mb-1">Agents</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-semibold text-hq-text">
              {session.agents.length}
            </span>
            {agentStats.working > 0 && (
              <span className="text-xs text-hq-success">
                ({agentStats.working} active)
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-col">
          <span className="text-xs text-hq-text-muted mb-1">Messages</span>
          <span className="text-lg font-semibold text-hq-text">
            {session.messages.length}
          </span>
        </div>

        {/* Status */}
        <div className="flex flex-col">
          <span className="text-xs text-hq-text-muted mb-1">Status</span>
          <span className={`text-sm font-medium capitalize ${
            session.status === 'active' ? 'text-hq-success' :
            session.status === 'idle' ? 'text-hq-warning' :
            'text-hq-text-muted'
          }`}>
            {session.status}
          </span>
        </div>
      </div>

      {/* Agents avatars */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {session.agents.slice(0, 5).map((agent, i) => (
            <AgentAvatar
              key={agent.id}
              agent={agent}
              size="sm"
              style={{ marginLeft: i > 0 ? '-8px' : '0', zIndex: 5 - i }}
            />
          ))}
          {session.agents.length > 5 && (
            <span className="ml-1 text-xs text-hq-text-muted">
              +{session.agents.length - 5}
            </span>
          )}
        </div>

        {/* Hover indicator */}
        <span className="text-xs text-hq-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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
