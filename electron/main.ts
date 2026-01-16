import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { SessionDiscoveryService } from './services/SessionDiscovery';
import { CLIBridgeService } from './services/CLIBridge';
import { RealtimeSyncService } from './services/RealtimeSync';

let mainWindow: BrowserWindow | null = null;
let discoveryService: SessionDiscoveryService;
let cliBridge: CLIBridgeService;
let realtimeSync: RealtimeSyncService;

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#0f1419',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function initializeServices() {
  discoveryService = new SessionDiscoveryService();
  cliBridge = new CLIBridgeService();
  realtimeSync = new RealtimeSyncService();

  // Forward realtime events to renderer
  realtimeSync.on('session-updated', (session) => {
    mainWindow?.webContents.send('session-updated', session);
  });

  realtimeSync.on('new-message', (sessionId, message) => {
    mainWindow?.webContents.send('new-message', sessionId, message);
  });

  // Forward CLI output to renderer
  cliBridge.on('output', (sessionId, chunk) => {
    mainWindow?.webContents.send('session-output', sessionId, chunk);
  });

  cliBridge.on('status-changed', (sessionId, status) => {
    mainWindow?.webContents.send('session-status-changed', sessionId, status);
  });
}

function setupIPC() {
  // Discovery
  ipcMain.handle('discover-sessions', async () => {
    return discoveryService.discoverSessions();
  });

  ipcMain.handle('get-session-messages', async (_, sessionId: string) => {
    return discoveryService.getSessionMessages(sessionId);
  });

  ipcMain.on('watch-sessions', () => {
    discoveryService.startWatching();
    realtimeSync.startWatching(discoveryService.getClaudePath());
  });

  ipcMain.on('stop-watching', () => {
    discoveryService.stopWatching();
    realtimeSync.stopWatching();
  });

  // Session control
  ipcMain.handle('take-over-session', async (_, sessionId: string, workingDir: string) => {
    return cliBridge.takeoverSession(sessionId, workingDir);
  });

  ipcMain.on('release-session', (_, sessionId: string) => {
    cliBridge.releaseSession(sessionId);
  });

  ipcMain.on('send-message', (_, sessionId: string, message: string, mode: 'interrupt' | 'queue') => {
    cliBridge.sendMessage(sessionId, message, mode);
  });

  ipcMain.handle('fork-session', async (_, sessionId: string, workingDir: string) => {
    return cliBridge.forkSession(sessionId, workingDir);
  });

  // Window controls
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow?.close();
  });
}

app.whenReady().then(() => {
  createWindow();
  initializeServices();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Cleanup
  discoveryService?.stopWatching();
  realtimeSync?.stopWatching();
  cliBridge?.releaseAll();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
