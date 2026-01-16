import { useEffect } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { MainContent } from './components/layout/MainContent';
import { useSessionStore } from './stores/sessionStore';

function App() {
  const { setSessions, setLoading, setError, addMessage, updateSession } =
    useSessionStore();

  useEffect(() => {
    // Initial session discovery
    const loadSessions = async () => {
      setLoading(true);
      try {
        const sessions = await window.electronAPI.discoverSessions();
        setSessions(sessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      }
    };

    loadSessions();

    // Start watching for changes
    window.electronAPI.watchSessions();

    // Set up event listeners
    const unsubscribeUpdated = window.electronAPI.onSessionUpdated((session) => {
      updateSession(session.id, session);
    });

    const unsubscribeMessage = window.electronAPI.onNewMessage(
      (sessionId, message) => {
        addMessage(sessionId, message);
      }
    );

    const unsubscribeStatus = window.electronAPI.onSessionStatusChanged(
      (sessionId, status) => {
        updateSession(sessionId, { status: status as any });
      }
    );

    // Cleanup
    return () => {
      window.electronAPI.stopWatching();
      unsubscribeUpdated();
      unsubscribeMessage();
      unsubscribeStatus();
    };
  }, [setSessions, setLoading, setError, addMessage, updateSession]);

  return (
    <div className="h-screen flex flex-col bg-hq-bg text-hq-text overflow-hidden">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}

export default App;
