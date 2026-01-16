// ============================================
// Core Data Models for Agent HQ
// ============================================

export interface Workspace {
  id: string;
  name: string;
  path: string;
  claudeProjectPath: string;
  sessions: Session[];
  color: string;
  icon?: string;
  lastActivity: Date;
}

export interface Session {
  id: string;
  workspaceId: string;
  workspaceName: string;
  filePath: string;
  status: SessionStatus;
  agents: Agent[];
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
  summary?: string;
  isControlled: boolean;
  currentTask?: string;
}

export type SessionStatus = 'active' | 'idle' | 'completed' | 'error';

export interface Agent {
  id: string;
  sessionId: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  currentTask?: string;
  messageCount: number;
  lastActivity: Date;
}

export type AgentType = 'main' | 'explore' | 'plan' | 'bash' | 'general-purpose' | 'unknown';

export type AgentStatus = 'working' | 'idle' | 'completed';

export interface Message {
  uuid: string;
  parentUuid: string | null;
  sessionId: string;
  agentId?: string;
  role: 'user' | 'assistant';
  content: MessageContent[];
  timestamp: Date;
  isSidechain: boolean;
  tokenUsage?: TokenUsage;
}

export type MessageContent =
  | TextContent
  | ToolUseContent
  | ToolResultContent;

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ToolUseContent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultContent {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

// ============================================
// Raw JSONL Message Types (from Claude Code)
// ============================================

export interface RawJSONLMessage {
  type: 'user' | 'assistant' | 'queue-operation';
  uuid?: string;
  parentUuid?: string | null;
  sessionId?: string;
  agentId?: string;
  isSidechain?: boolean;
  timestamp?: string;
  message?: {
    role: 'user' | 'assistant';
    content: string | MessageContent[];
    model?: string;
    id?: string;
    stop_reason?: string | null;
    usage?: TokenUsage;
  };
  userType?: string;
  cwd?: string;
  version?: string;
  gitBranch?: string;
  operation?: string;
  requestId?: string;
}

// ============================================
// IPC Types (Main <-> Renderer communication)
// ============================================

export interface IPCChannels {
  // Discovery
  'discover-sessions': () => Promise<Session[]>;
  'watch-sessions': () => void;
  'stop-watching': () => void;

  // Session control
  'take-over-session': (sessionId: string) => Promise<boolean>;
  'release-session': (sessionId: string) => void;
  'send-message': (sessionId: string, message: string, mode: 'interrupt' | 'queue') => void;
  'fork-session': (sessionId: string) => Promise<string>;

  // Events (renderer listens)
  'session-updated': (session: Session) => void;
  'new-message': (sessionId: string, message: Message) => void;
  'session-output': (sessionId: string, chunk: string) => void;
  'session-status-changed': (sessionId: string, status: SessionStatus) => void;
}

// ============================================
// Configuration
// ============================================

export interface AppConfig {
  claudeConfigPath: string;
  manualWorkspaces: ManualWorkspace[];
  theme: 'light' | 'dark' | 'system';
  defaultChatMode: 'interrupt' | 'queue';
  showCompletedSessions: boolean;
  maxHistoryMessages: number;
}

export interface ManualWorkspace {
  path: string;
  name: string;
}

// ============================================
// UI State Types
// ============================================

export interface WorkspaceState {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface SessionState {
  sessions: Map<string, Session>;
  selectedSessionId: string | null;
  controlledSessionIds: Set<string>;
}

export interface ChatState {
  activeSessionId: string | null;
  inputMessage: string;
  sendMode: 'interrupt' | 'queue';
  isStreaming: boolean;
}
