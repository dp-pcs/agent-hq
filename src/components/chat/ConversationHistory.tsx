import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../types';

interface ConversationHistoryProps {
  messages: Message[];
  streamBuffer?: string;
}

export function ConversationHistory({
  messages,
  streamBuffer,
}: ConversationHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamBuffer]);

  // Filter out sidechain messages for cleaner view (can add toggle later)
  const mainMessages = messages.filter((m) => !m.isSidechain);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4 py-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {mainMessages.length === 0 ? (
          <div className="text-center py-12 text-hq-text-muted">
            <p>No messages yet</p>
          </div>
        ) : (
          mainMessages.map((message, index) => (
            <MessageBubble
              key={message.uuid}
              message={message}
              showTimestamp={
                index === 0 ||
                shouldShowTimestamp(
                  mainMessages[index - 1]?.timestamp,
                  message.timestamp
                )
              }
            />
          ))
        )}

        {/* Streaming buffer */}
        {streamBuffer && (
          <div className="bg-hq-surface border border-hq-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-hq-success rounded-full animate-pulse" />
              <span className="text-xs text-hq-text-muted">Streaming...</span>
            </div>
            <pre className="text-sm text-hq-text whitespace-pre-wrap font-mono">
              {streamBuffer}
            </pre>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function shouldShowTimestamp(prev: Date | undefined, current: Date): boolean {
  if (!prev) return true;
  const prevTime = new Date(prev).getTime();
  const currTime = new Date(current).getTime();
  // Show timestamp if more than 5 minutes apart
  return currTime - prevTime > 5 * 60 * 1000;
}
