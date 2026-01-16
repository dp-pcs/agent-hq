import { useSessionStore } from '../../stores/sessionStore';
import { SessionGrid } from '../workspace/SessionGrid';
import { ChatPanel } from '../chat/ChatPanel';

export function MainContent() {
  const { sessions, selectedSessionId } = useSessionStore();
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Session grid / workspace view */}
      <div className="flex-1 overflow-hidden">
        {selectedSession ? (
          <ChatPanel session={selectedSession} />
        ) : (
          <SessionGrid sessions={sessions} />
        )}
      </div>
    </div>
  );
}
