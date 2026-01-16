import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Discovery
  discoverSessions: () => ipcRenderer.invoke('discover-sessions'),
  getSessionMessages: (sessionId: string) => ipcRenderer.invoke('get-session-messages', sessionId),
  watchSessions: () => ipcRenderer.send('watch-sessions'),
  stopWatching: () => ipcRenderer.send('stop-watching'),

  // Session control
  takeOverSession: (sessionId: string, workingDir: string) =>
    ipcRenderer.invoke('take-over-session', sessionId, workingDir),
  releaseSession: (sessionId: string) => ipcRenderer.send('release-session', sessionId),
  sendMessage: (sessionId: string, message: string, mode: 'interrupt' | 'queue') =>
    ipcRenderer.send('send-message', sessionId, message, mode),
  forkSession: (sessionId: string, workingDir: string) =>
    ipcRenderer.invoke('fork-session', sessionId, workingDir),

  // Event listeners
  onSessionUpdated: (callback: (session: any) => void) => {
    const subscription = (_event: any, session: any) => callback(session);
    ipcRenderer.on('session-updated', subscription);
    return () => ipcRenderer.removeListener('session-updated', subscription);
  },

  onNewMessage: (callback: (sessionId: string, message: any) => void) => {
    const subscription = (_event: any, sessionId: string, message: any) =>
      callback(sessionId, message);
    ipcRenderer.on('new-message', subscription);
    return () => ipcRenderer.removeListener('new-message', subscription);
  },

  onSessionOutput: (callback: (sessionId: string, chunk: string) => void) => {
    const subscription = (_event: any, sessionId: string, chunk: string) =>
      callback(sessionId, chunk);
    ipcRenderer.on('session-output', subscription);
    return () => ipcRenderer.removeListener('session-output', subscription);
  },

  onSessionStatusChanged: (callback: (sessionId: string, status: string) => void) => {
    const subscription = (_event: any, sessionId: string, status: string) =>
      callback(sessionId, status);
    ipcRenderer.on('session-status-changed', subscription);
    return () => ipcRenderer.removeListener('session-status-changed', subscription);
  },

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
});

// Type definitions for the exposed API
export interface ElectronAPI {
  discoverSessions: () => Promise<any[]>;
  getSessionMessages: (sessionId: string) => Promise<any[]>;
  watchSessions: () => void;
  stopWatching: () => void;
  takeOverSession: (sessionId: string, workingDir: string) => Promise<boolean>;
  releaseSession: (sessionId: string) => void;
  sendMessage: (sessionId: string, message: string, mode: 'interrupt' | 'queue') => void;
  forkSession: (sessionId: string, workingDir: string) => Promise<string>;
  onSessionUpdated: (callback: (session: any) => void) => () => void;
  onNewMessage: (callback: (sessionId: string, message: any) => void) => () => void;
  onSessionOutput: (callback: (sessionId: string, chunk: string) => void) => () => void;
  onSessionStatusChanged: (callback: (sessionId: string, status: string) => void) => () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
