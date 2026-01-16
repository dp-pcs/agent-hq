import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { useChatStore } from '../../stores/chatStore';
import { ConversationHistory } from './ConversationHistory';
import { ChatInput } from './ChatInput';
import { StatusIndicator } from '../shared/StatusIndicator';
import { AgentAvatar } from '../shared/AgentAvatar';
import { Button } from '../shared/Button';
import type { Session, Message } from '../../types';

interface ChatPanelProps {
  session: Session;
}

export function ChatPanel({ session }: ChatPanelProps) {
  const { selectSession, setControlled } = useSessionStore();
  const { isStreaming, setStreaming, streamBuffer, appendToStream, clearStream } =
    useChatStore();
  const [messages, setMessages] = useState<Message[]>(session.messages);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);

  // Load full message history when panel opens
  useEffect(() => {
    const loadFullHistory = async () => {
      setIsLoadingFull(true);
      try {
        const fullMessages = await window.electronAPI.getSessionMessages(
          session.id
        );
        setMessages(fullMessages);
      } catch (err) {
        console.error('Failed to load full history:', err);
      } finally {
        setIsLoadingFull(false);
      }
    };

    loadFullHistory();
  }, [session.id]);

  // Listen for new messages
  useEffect(() => {
    const unsubscribe = window.electronAPI.onNewMessage((sessionId, message) => {
      if (sessionId === session.id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return unsubscribe;
  }, [session.id]);

  // Listen for streaming output when controlled
  useEffect(() => {
    if (!session.isControlled) return;

    const unsubscribe = window.electronAPI.onSessionOutput((sessionId, chunk) => {
      if (sessionId === session.id) {
        appendToStream(chunk);
      }
    });

    return unsubscribe;
  }, [session.id, session.isControlled, appendToStream]);

  const handleTakeControl = async () => {
    setIsTakingOver(true);
    try {
      // Use workingDirectory from session, or workspace name as fallback
      const workingDir = session.workingDirectory || session.workspaceName || '';
      const success = await window.electronAPI.takeOverSession(
        session.id,
        workingDir
      );
      if (success) {
        setControlled(session.id, true);
        setStreaming(true);
      }
    } catch (err) {
      console.error('Failed to take control:', err);
    } finally {
      setIsTakingOver(false);
    }
  };

  const handleReleaseControl = () => {
    window.electronAPI.releaseSession(session.id);
    setControlled(session.id, false);
    setStreaming(false);
    clearStream();
  };

  const handleSendMessage = (message: string, mode: 'interrupt' | 'queue') => {
    if (!session.isControlled) {
      // Need to take control first
      handleTakeControl().then(() => {
        window.electronAPI.sendMessage(session.id, message, mode);
      });
    } else {
      window.electronAPI.sendMessage(session.id, message, mode);
    }
  };

  const handleBack = () => {
    selectSession(null);
  };

  return (
    <div className="h-full flex flex-col bg-hq-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hq-border bg-hq-surface">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1.5 hover:bg-hq-border rounded transition-colors"
          >
            <BackIcon />
          </button>

          <div className="flex items-center gap-2">
            <StatusIndicator status={session.status} size="md" />
            <div>
              <h2 className="font-semibold text-hq-text">
                {session.workspaceName}
              </h2>
              <p className="text-xs text-hq-text-muted font-mono">
                {session.id.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Agents */}
          <div className="flex items-center gap-1">
            {session.agents.map((agent) => (
              <AgentAvatar key={agent.id} agent={agent} size="sm" />
            ))}
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-2">
            {session.isControlled ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleReleaseControl}
              >
                <ReleaseIcon />
                Release
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleTakeControl}
                disabled={isTakingOver}
              >
                {isTakingOver ? (
                  <SpinnerIcon />
                ) : (
                  <ControlIcon />
                )}
                Take Control
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        {isLoadingFull ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin-slow mb-2">
                <SpinnerIcon />
              </div>
              <p className="text-sm text-hq-text-muted">Loading history...</p>
            </div>
          </div>
        ) : (
          <ConversationHistory
            messages={messages}
            streamBuffer={isStreaming ? streamBuffer : undefined}
          />
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        isControlled={session.isControlled}
        isStreaming={isStreaming}
      />
    </div>
  );
}

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 4l-6 6 6 6" />
    </svg>
  );
}

function ControlIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
    </svg>
  );
}

function ReleaseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="animate-spin"
    >
      <circle cx="8" cy="8" r="6" strokeOpacity="0.25" />
      <path d="M8 2a6 6 0 014.24 10.24" />
    </svg>
  );
}
