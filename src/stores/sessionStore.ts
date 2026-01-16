import { create } from 'zustand';
import type { Session, Message, SessionStatus } from '../types';

interface SessionStore {
  // State
  sessions: Session[];
  selectedSessionId: string | null;
  controlledSessionIds: Set<string>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  selectSession: (sessionId: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  setControlled: (sessionId: string, controlled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getSelectedSession: () => Session | null;
  getSessionsByWorkspace: () => Map<string, Session[]>;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  selectedSessionId: null,
  controlledSessionIds: new Set(),
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions, isLoading: false }),

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
    })),

  updateSession: (sessionId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    })),

  selectSession: (sessionId) => set({ selectedSessionId: sessionId }),

  addMessage: (sessionId, message) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [...s.messages, message],
              lastMessageAt: message.timestamp,
              status: 'active' as SessionStatus,
            }
          : s
      ),
    })),

  setControlled: (sessionId, controlled) =>
    set((state) => {
      const newSet = new Set(state.controlledSessionIds);
      if (controlled) {
        newSet.add(sessionId);
      } else {
        newSet.delete(sessionId);
      }
      return {
        controlledSessionIds: newSet,
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, isControlled: controlled } : s
        ),
      };
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  getSelectedSession: () => {
    const { sessions, selectedSessionId } = get();
    return sessions.find((s) => s.id === selectedSessionId) || null;
  },

  getSessionsByWorkspace: () => {
    const { sessions } = get();
    const grouped = new Map<string, Session[]>();

    for (const session of sessions) {
      const workspaceId = session.workspaceId;
      const existing = grouped.get(workspaceId) || [];
      grouped.set(workspaceId, [...existing, session]);
    }

    return grouped;
  },
}));
