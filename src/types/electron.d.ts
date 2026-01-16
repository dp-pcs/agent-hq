// Type definitions for the Electron API exposed via preload

export interface ElectronAPI {
  // Platform info
  platform: NodeJS.Platform;

  // Discovery
  discoverSessions: () => Promise<any[]>;
  getSessionMessages: (sessionId: string) => Promise<any[]>;
  watchSessions: () => void;
  stopWatching: () => void;

  // Session control
  takeOverSession: (sessionId: string, workingDir: string) => Promise<boolean>;
  releaseSession: (sessionId: string) => void;
  sendMessage: (sessionId: string, message: string, mode: 'interrupt' | 'queue') => void;
  forkSession: (sessionId: string, workingDir: string) => Promise<string>;

  // Event listeners (return unsubscribe function)
  onSessionUpdated: (callback: (session: any) => void) => () => void;
  onNewMessage: (callback: (sessionId: string, message: any) => void) => () => void;
  onSessionOutput: (callback: (sessionId: string, chunk: string) => void) => () => void;
  onSessionStatusChanged: (callback: (sessionId: string, status: string) => void) => () => void;

  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
