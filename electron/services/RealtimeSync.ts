import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import * as readline from 'readline';

interface FilePosition {
  path: string;
  lastLine: number;
  lastSize: number;
}

export class RealtimeSyncService extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private filePositions: Map<string, FilePosition> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
  }

  startWatching(claudePath: string): void {
    if (this.watcher) {
      this.stopWatching();
    }

    const projectsPath = path.join(claudePath, 'projects');

    this.watcher = chokidar.watch(projectsPath, {
      persistent: true,
      ignoreInitial: true,
      depth: 4,
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 50,
      },
    });

    this.watcher.on('change', (filePath) => {
      this.handleFileChange(filePath);
    });

    this.watcher.on('add', (filePath) => {
      this.handleFileChange(filePath);
    });

    console.log('RealtimeSync: Started watching', projectsPath);
  }

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.filePositions.clear();
  }

  private handleFileChange(filePath: string): void {
    if (!filePath.endsWith('.jsonl')) return;

    // Debounce rapid changes
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.processFileChange(filePath);
      this.debounceTimers.delete(filePath);
    }, 100);

    this.debounceTimers.set(filePath, timer);
  }

  private async processFileChange(filePath: string): Promise<void> {
    try {
      const stat = fs.statSync(filePath);
      const position = this.filePositions.get(filePath);

      // If file was truncated, reset position
      if (position && stat.size < position.lastSize) {
        this.filePositions.delete(filePath);
      }

      // Read new lines since last position
      const newMessages = await this.readNewLines(filePath);

      if (newMessages.length > 0) {
        const sessionId = this.extractSessionId(filePath);
        if (sessionId) {
          for (const message of newMessages) {
            this.emit('new-message', sessionId, message);
          }

          // Emit session update
          this.emit('session-updated', {
            id: sessionId,
            lastMessageAt: new Date(),
            status: 'active',
          });
        }
      }
    } catch (err) {
      console.error('Error processing file change:', err);
    }
  }

  private async readNewLines(filePath: string): Promise<any[]> {
    const messages: any[] = [];
    const position = this.filePositions.get(filePath);
    let lineNumber = 0;
    const startLine = position?.lastLine || 0;

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      lineNumber++;

      if (lineNumber <= startLine) continue;
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);

        // Skip queue operations
        if (parsed.type === 'queue-operation') continue;

        if (parsed.type === 'user' || parsed.type === 'assistant') {
          messages.push({
            uuid: parsed.uuid,
            parentUuid: parsed.parentUuid,
            sessionId: parsed.sessionId,
            agentId: parsed.agentId,
            role: parsed.type,
            content: this.normalizeContent(parsed.message?.content),
            timestamp: new Date(parsed.timestamp || Date.now()),
            isSidechain: parsed.isSidechain || false,
          });
        }
      } catch {
        // Skip malformed lines
      }
    }

    // Update position
    const stat = fs.statSync(filePath);
    this.filePositions.set(filePath, {
      path: filePath,
      lastLine: lineNumber,
      lastSize: stat.size,
    });

    return messages;
  }

  private normalizeContent(content: any): any[] {
    if (!content) return [];
    if (typeof content === 'string') {
      return [{ type: 'text', text: content }];
    }
    if (Array.isArray(content)) {
      return content;
    }
    return [content];
  }

  private extractSessionId(filePath: string): string | null {
    const basename = path.basename(filePath, '.jsonl');

    // Check if it's a main session file (UUID format)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(basename)) {
      return basename;
    }

    // Check if it's an agent file (agent-XXXXX.jsonl)
    if (basename.startsWith('agent-')) {
      // Extract session ID from parent directory
      const parentDir = path.basename(path.dirname(path.dirname(filePath)));
      if (uuidRegex.test(parentDir)) {
        return parentDir;
      }
    }

    return null;
  }
}
