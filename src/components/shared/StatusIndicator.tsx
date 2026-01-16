import type { SessionStatus, AgentStatus } from '../../types';

interface StatusIndicatorProps {
  status: SessionStatus | AgentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusIndicator({ status, size = 'md' }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const statusColors = {
    active: 'bg-hq-success',
    working: 'bg-hq-success',
    idle: 'bg-hq-warning',
    completed: 'bg-hq-text-muted',
    error: 'bg-hq-error',
  };

  const shouldAnimate = status === 'active' || status === 'working';

  return (
    <span className="relative flex items-center justify-center">
      <span
        className={`
          ${sizeClasses[size]}
          ${statusColors[status]}
          rounded-full
          ${shouldAnimate ? 'animate-pulse-subtle' : ''}
        `}
      />
      {shouldAnimate && (
        <span
          className={`
            absolute
            ${sizeClasses[size]}
            ${statusColors[status]}
            rounded-full
            animate-ping
            opacity-75
          `}
        />
      )}
    </span>
  );
}
