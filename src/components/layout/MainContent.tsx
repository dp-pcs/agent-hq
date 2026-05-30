import { useSessionStore } from '../../stores/sessionStore';
import Dashboard from '../dashboard/Dashboard';
import { ChatPanel } from '../chat/ChatPanel';
import { SessionGrid } from '../workspace/SessionGrid';

export function MainContent() {
  const { sessions, selectedSessionId, currentView } = useSessionStore();
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Session grid / workspace view */}
      <div className="flex-1 overflow-hidden">
        {selectedSession ? (
          <ChatPanel session={selectedSession} />
        ) : currentView === 'dashboard' ? (
          <Dashboard />
        ) : (
          <SessionGrid sessions={sessions} />
        )}
      </div>
    </div>
  );
}
