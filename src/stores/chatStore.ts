import { create } from 'zustand';

interface ChatStore {
  // State
  inputMessage: string;
  sendMode: 'interrupt' | 'queue';
  isStreaming: boolean;
  streamBuffer: string;

  // Actions
  setInputMessage: (message: string) => void;
  setSendMode: (mode: 'interrupt' | 'queue') => void;
  setStreaming: (streaming: boolean) => void;
  appendToStream: (chunk: string) => void;
  clearStream: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  inputMessage: '',
  sendMode: 'queue',
  isStreaming: false,
  streamBuffer: '',

  setInputMessage: (message) => set({ inputMessage: message }),

  setSendMode: (mode) => set({ sendMode: mode }),

  setStreaming: (streaming) =>
    set({ isStreaming: streaming, streamBuffer: streaming ? '' : '' }),

  appendToStream: (chunk) =>
    set((state) => ({ streamBuffer: state.streamBuffer + chunk })),

  clearStream: () => set({ streamBuffer: '' }),
}));
