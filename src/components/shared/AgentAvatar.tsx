import type { Agent } from '../../types';
import { CSSProperties } from 'react';

interface AgentAvatarProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}

export function AgentAvatar({ agent, size = 'md', style }: AgentAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const typeColors: Record<string, string> = {
    main: 'from-blue-500 to-blue-600',
    explore: 'from-purple-500 to-purple-600',
    plan: 'from-green-500 to-green-600',
    bash: 'from-orange-500 to-orange-600',
    'general-purpose': 'from-gray-500 to-gray-600',
    unknown: 'from-gray-400 to-gray-500',
  };

  const typeIcons: Record<string, string> = {
    main: 'M',
    explore: 'E',
    plan: 'P',
    bash: 'B',
    'general-purpose': 'G',
    unknown: '?',
  };

  const statusBorder = {
    working: 'ring-2 ring-hq-success ring-offset-1 ring-offset-hq-surface',
    idle: 'ring-2 ring-hq-warning ring-offset-1 ring-offset-hq-surface',
    completed: '',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bg-gradient-to-br ${typeColors[agent.type] || typeColors.unknown}
        rounded-full
        flex items-center justify-center
        font-semibold text-white
        ${statusBorder[agent.status]}
        border-2 border-hq-surface
      `}
      style={style}
      title={`${agent.name} (${agent.status})`}
    >
      {typeIcons[agent.type] || '?'}
    </div>
  );
}
