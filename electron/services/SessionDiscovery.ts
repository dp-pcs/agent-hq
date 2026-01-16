import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';
import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';

interface Session {
  id: string;
  workspaceId: string;
  workspaceName: string;
  filePath: string;
  status: 'active' | 'idle' | 'completed' | 'error';
  agents: Agent[];
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
  summary?: string;
  isControlled: boolean;
  workingDirectory?: string;
}

interface Agent {
  id: string;
  sessionId: string;
  name: string;
  type: string;
  status: 'working' | 'idle' | 'completed';
  messageCount: number;
  lastActivity: Date;
}

interface Message {
  uuid: string;
  parentUuid: string | null;
  sessionId: string;
  agentId?: string;
  role: 'user' | 'assistant';
  content: any[];
  timestamp: Date;
  isSidechain: boolean;
}

export class SessionDiscoveryService extends EventEmitter {
  private claudePath: string;
  private projectsPath: string;
  private watcher: chokidar.FSWatcher | null = null;
  private sessions: Map<string, Session> = new Map();

  constructor() {
    super();
    this.claudePath = path.join(os.homedir(), '.claude');
    this.projectsPath = path.join(this.claudePath, 'projects');
  }

  getClaudePath(): string {
    return this.claudePath;
  }

  async discoverSessions(): Promise<Session[]> {
    const sessions: Session[] = [];

    if (!fs.existsSync(this.projectsPath)) {
      console.log('Claude projects directory not found:', this.projectsPath);
      return sessions;
    }

    try {
      const workspaceDirs = fs.readdirSync(this.projectsPath);

      for (const workspaceDir of workspaceDirs) {
        const workspacePath = path.join(this.projectsPath, workspaceDir);
        const stat = fs.statSync(workspacePath);

        if (!stat.isDirectory()) continue;

        // Find all session files (UUID.jsonl) in the workspace
        const files = fs.readdirSync(workspacePath);
        const sessionFiles = files.filter(
          (f) => f.endsWith('.jsonl') && this.isValidUUID(f.replace('.jsonl', ''))
        );

        for (const sessionFile of sessionFiles) {
          const sessionId = sessionFile.replace('.jsonl', '');
          const sessionPath = path.join(workspacePath, sessionFile);

          try {
            const session = await this.parseSession(
              sessionId,
              sessionPath,
              workspaceDir
            );
            sessions.push(session);
            this.sessions.set(sessionId, session);
          } catch (err) {
            console.error(`Error parsing session ${sessionId}:`, err);
          }
        }
      }

      // Sort by last activity (most recent first)
      sessions.sort(
        (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
      );

      return sessions;
    } catch (err) {
      console.error('Error discovering sessions:', err);
      return sessions;
    }
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return this.parseSessionMessages(session.filePath);
  }

  private async parseSession(
    sessionId: string,
    filePath: string,
    workspaceDir: string
  ): Promise<Session> {
    const messages = await this.parseSessionMessages(filePath);
    const agents = await this.discoverAgents(sessionId, filePath);
    const stat = fs.statSync(filePath);

    // Decode workspace name from the directory name
    const workspaceName = this.decodeWorkspaceName(workspaceDir);

    // Determine status based on file modification time
    const now = Date.now();
    const lastModified = stat.mtimeMs;
    const timeSinceModified = now - lastModified;

    let status: Session['status'] = 'idle';
    if (timeSinceModified < 30000) {
      // Less than 30 seconds
      status = 'active';
    } else if (timeSinceModified < 300000) {
      // Less than 5 minutes
      status = 'idle';
    } else {
      status = 'completed';
    }

    // Extract working directory from first user message
    let workingDirectory: string | undefined;
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (firstUserMsg) {
      // The cwd is stored in the raw message
      workingDirectory = workspaceName;
    }

    return {
      id: sessionId,
      workspaceId: workspaceDir,
      workspaceName,
      filePath,
      status,
      agents,
      messages: messages.slice(-50), // Keep last 50 for initial load
      createdAt: messages[0]?.timestamp || new Date(stat.birthtimeMs),
      lastMessageAt: messages[messages.length - 1]?.timestamp || new Date(stat.mtimeMs),
      isControlled: false,
      workingDirectory,
    };
  }

  private async parseSessionMessages(filePath: string): Promise<Message[]> {
    const messages: Message[] = [];

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const raw = JSON.parse(line);

        // Skip queue operations
        if (raw.type === 'queue-operation') continue;

        if (raw.type === 'user' || raw.type === 'assistant') {
          const message: Message = {
            uuid: raw.uuid || crypto.randomUUID(),
            parentUuid: raw.parentUuid || null,
            sessionId: raw.sessionId || '',
            agentId: raw.agentId,
            role: raw.type as 'user' | 'assistant',
            content: this.normalizeContent(raw.message?.content),
            timestamp: new Date(raw.timestamp || Date.now()),
            isSidechain: raw.isSidechain || false,
          };
          messages.push(message);
        }
      } catch (err) {
        // Skip malformed lines
        console.warn('Skipping malformed JSONL line');
      }
    }

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

  private async discoverAgents(
    sessionId: string,
    sessionFilePath: string
  ): Promise<Agent[]> {
    const agents: Agent[] = [];
    const sessionDir = path.dirname(sessionFilePath);
    const subagentsDir = path.join(sessionDir, sessionId, 'subagents');

    // Main agent always exists
    agents.push({
      id: 'main',
      sessionId,
      name: 'Main Agent',
      type: 'main',
      status: 'idle',
      messageCount: 0,
      lastActivity: new Date(),
    });

    // Check for subagents
    if (fs.existsSync(subagentsDir)) {
      const agentFiles = fs.readdirSync(subagentsDir).filter((f) =>
        f.startsWith('agent-') && f.endsWith('.jsonl')
      );

      for (const agentFile of agentFiles) {
        const agentId = agentFile.replace('agent-', '').replace('.jsonl', '');
        const agentPath = path.join(subagentsDir, agentFile);
        const stat = fs.statSync(agentPath);

        // Parse agent file to get message count and type
        const messages = await this.parseSessionMessages(agentPath);
        const agentType = this.inferAgentType(messages);

        agents.push({
          id: agentId,
          sessionId,
          name: this.formatAgentName(agentType),
          type: agentType,
          status: this.inferAgentStatus(stat.mtimeMs),
          messageCount: messages.length,
          lastActivity: new Date(stat.mtimeMs),
        });
      }
    }

    return agents;
  }

  private inferAgentType(messages: Message[]): string {
    // Look for clues in the messages about what type of agent this is
    const firstMessage = messages[0];
    if (!firstMessage) return 'unknown';

    const content = firstMessage.content
      .map((c: any) => (c.type === 'text' ? c.text : ''))
      .join(' ')
      .toLowerCase();

    if (content.includes('explore') || content.includes('codebase')) return 'explore';
    if (content.includes('plan') || content.includes('implementation')) return 'plan';
    if (content.includes('bash') || content.includes('command')) return 'bash';
    return 'general-purpose';
  }

  private formatAgentName(type: string): string {
    const names: Record<string, string> = {
      main: 'Main Agent',
      explore: 'Explorer',
      plan: 'Planner',
      bash: 'Bash Runner',
      'general-purpose': 'Worker',
      unknown: 'Agent',
    };
    return names[type] || 'Agent';
  }

  private inferAgentStatus(
    lastModifiedMs: number
  ): 'working' | 'idle' | 'completed' {
    const timeSince = Date.now() - lastModifiedMs;
    if (timeSince < 30000) return 'working';
    if (timeSince < 300000) return 'idle';
    return 'completed';
  }

  private decodeWorkspaceName(encodedPath: string): string {
    // Claude Code encodes paths by replacing / with -
    // e.g., "-Users-david-projects-myapp" -> "/Users/david/projects/myapp"
    if (encodedPath.startsWith('-')) {
      const decoded = encodedPath.replace(/-/g, '/');
      // Return just the last part as the workspace name
      const parts = decoded.split('/').filter(Boolean);
      return parts[parts.length - 1] || encodedPath;
    }
    return encodedPath;
  }

  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  startWatching(): void {
    if (this.watcher) return;

    this.watcher = chokidar.watch(this.projectsPath, {
      persistent: true,
      ignoreInitial: true,
      depth: 3,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    });

    this.watcher.on('change', async (filePath) => {
      if (!filePath.endsWith('.jsonl')) return;

      const sessionId = path.basename(filePath, '.jsonl');
      if (!this.isValidUUID(sessionId)) return;

      // Re-parse the session
      const workspaceDir = path.basename(path.dirname(filePath));
      try {
        const session = await this.parseSession(sessionId, filePath, workspaceDir);
        this.sessions.set(sessionId, session);
        this.emit('session-updated', session);
      } catch (err) {
        console.error(`Error re-parsing session ${sessionId}:`, err);
      }
    });

    this.watcher.on('add', async (filePath) => {
      if (!filePath.endsWith('.jsonl')) return;

      const sessionId = path.basename(filePath, '.jsonl');
      if (!this.isValidUUID(sessionId)) return;

      const workspaceDir = path.basename(path.dirname(filePath));
      try {
        const session = await this.parseSession(sessionId, filePath, workspaceDir);
        this.sessions.set(sessionId, session);
        this.emit('session-added', session);
      } catch (err) {
        console.error(`Error parsing new session ${sessionId}:`, err);
      }
    });
  }

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
