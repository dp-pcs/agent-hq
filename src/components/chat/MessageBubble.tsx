import type { Message, MessageContent } from '../../types';

interface MessageBubbleProps {
  message: Message;
  showTimestamp?: boolean;
}

export function MessageBubble({ message, showTimestamp }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {showTimestamp && (
        <div className="text-xs text-hq-text-muted mb-1 px-2">
          {formatTimestamp(new Date(message.timestamp))}
        </div>
      )}

      <div
        className={`
          max-w-[85%] rounded-lg px-4 py-3
          ${
            isUser
              ? 'bg-hq-accent text-white'
              : 'bg-hq-surface border border-hq-border'
          }
        `}
      >
        {message.content.map((content, index) => (
          <ContentBlock key={index} content={content} isUser={isUser} />
        ))}
      </div>

      {message.agentId && (
        <div className="text-xs text-hq-text-muted mt-1 px-2">
          Agent: {message.agentId}
        </div>
      )}
    </div>
  );
}

interface ContentBlockProps {
  content: MessageContent;
  isUser: boolean;
}

function ContentBlock({ content, isUser }: ContentBlockProps) {
  switch (content.type) {
    case 'text':
      return (
        <div className="message-content whitespace-pre-wrap text-sm">
          {content.text}
        </div>
      );

    case 'tool_use':
      return (
        <div className="tool-call my-2 px-3 py-2 rounded">
          <div className="flex items-center gap-2 mb-1">
            <ToolIcon />
            <span className="font-medium text-sm">{content.name}</span>
          </div>
          {content.input && Object.keys(content.input).length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-hq-text-muted hover:text-hq-text">
                View input
              </summary>
              <pre className="mt-1 p-2 bg-hq-bg/50 rounded overflow-x-auto">
                {JSON.stringify(content.input, null, 2)}
              </pre>
            </details>
          )}
        </div>
      );

    case 'tool_result':
      const isError = content.is_error;
      return (
        <div
          className={`my-2 px-3 py-2 rounded ${
            isError ? 'tool-error' : 'tool-result'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {isError ? <ErrorIcon /> : <CheckIcon />}
            <span className="font-medium text-sm">
              {isError ? 'Error' : 'Result'}
            </span>
          </div>
          <div className="text-xs text-hq-text-muted max-h-40 overflow-y-auto">
            <pre className="whitespace-pre-wrap">
              {typeof content.content === 'string'
                ? truncateContent(content.content)
                : JSON.stringify(content.content, null, 2)}
            </pre>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function truncateContent(content: string, maxLength = 500): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '\n... (truncated)';
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ToolIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-hq-accent"
    >
      <path d="M8.5 2.5l3 3-6 6-3.5.5.5-3.5 6-6z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-hq-success"
    >
      <path d="M3 7l3 3 5-6" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-hq-error"
    >
      <circle cx="7" cy="7" r="5" />
      <path d="M7 4v4M7 10v.5" />
    </svg>
  );
}
