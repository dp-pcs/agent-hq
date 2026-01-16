import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { Button } from '../shared/Button';

interface ChatInputProps {
  onSend: (message: string, mode: 'interrupt' | 'queue') => void;
  isControlled: boolean;
  isStreaming: boolean;
}

export function ChatInput({ onSend, isControlled, isStreaming }: ChatInputProps) {
  const { inputMessage, setInputMessage, sendMode, setSendMode } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [inputMessage]);

  const handleSubmit = () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    onSend(trimmed, sendMode);
    setInputMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-hq-border bg-hq-surface p-4">
      <div className="max-w-3xl mx-auto">
        {/* Mode selector */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-hq-text-muted">Send mode:</span>
            <div className="flex bg-hq-border rounded-lg p-0.5">
              <button
                onClick={() => setSendMode('queue')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  sendMode === 'queue'
                    ? 'bg-hq-surface text-hq-text'
                    : 'text-hq-text-muted hover:text-hq-text'
                }`}
              >
                Queue
              </button>
              <button
                onClick={() => setSendMode('interrupt')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  sendMode === 'interrupt'
                    ? 'bg-hq-surface text-hq-text'
                    : 'text-hq-text-muted hover:text-hq-text'
                }`}
              >
                Interrupt
              </button>
            </div>
          </div>

          {!isControlled && (
            <span className="text-xs text-hq-warning flex items-center gap-1">
              <WarningIcon />
              Not controlling - will take over on send
            </span>
          )}

          {isStreaming && (
            <span className="text-xs text-hq-success flex items-center gap-1">
              <StreamIcon />
              Streaming
            </span>
          )}
        </div>

        {/* Input area */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="w-full px-4 py-3 bg-hq-bg border border-hq-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-hq-accent focus:border-transparent text-sm text-hq-text placeholder-hq-text-muted"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!inputMessage.trim()}
            variant="primary"
            size="md"
            className="self-end"
          >
            <SendIcon />
          </Button>
        </div>

        {/* Keyboard hints */}
        <div className="mt-2 flex items-center gap-4 text-xs text-hq-text-muted">
          <span>
            <kbd className="px-1.5 py-0.5 bg-hq-border rounded">Enter</kbd> to send
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-hq-border rounded">Shift+Enter</kbd> for newline
          </span>
        </div>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 9l12-6-3 15-4-6-5-3z" />
      <path d="M8 12l4-6" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6 1l5 9H1l5-9z" />
      <path d="M6 5v2M6 8.5v.5" />
    </svg>
  );
}

function StreamIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="animate-pulse"
    >
      <circle cx="6" cy="6" r="2" />
      <path d="M6 1v2M6 9v2M1 6h2M9 6h2" />
    </svg>
  );
}
