# Agent HQ - Claude Code Session Management Platform

## Vision
A visual command center for managing multiple Claude Code sessions across repositories. Think of it as "mission control" for your AI agents - see all your workspaces, monitor agent activity, and interact with any session from a single interface.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent HQ (Electron)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Workspace  │  │  Workspace  │  │  Workspace  │   ...        │
│  │  (Repo A)   │  │  (Repo B)   │  │  (Repo C)   │              │
│  │  ┌───────┐  │  │  ┌───────┐  │  │  ┌───────┐  │              │
│  │  │Agent 1│  │  │  │Agent 1│  │  │  │Agent 1│  │              │
│  │  │Agent 2│  │  │  │Agent 2│  │  │  └───────┘  │              │
│  │  └───────┘  │  │  └───────┘  │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                      Chat Panel (Active Session)                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Full conversation history]                                  ││
│  │ [Real-time streaming output]                                 ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ Type message... [Send] [Interrupt] [Queue]              │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Session Watcher │  │  JSONL Parser   │  │   CLI Bridge    │
│ (chokidar)      │  │  (streaming)    │  │  (node-pty)     │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ~/.claude/projects/                           │
│  ├── repo-a/                                                     │
│  │   └── {session-id}.jsonl                                      │
│  │       └── subagents/agent-{id}.jsonl                          │
│  ├── repo-b/                                                     │
│  │   └── {session-id}.jsonl                                      │
│  └── repo-c/                                                     │
│      └── {session-id}.jsonl                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Electron | Full filesystem access, native feel, can spawn CLI processes |
| **UI** | React + TypeScript | Component-based, strong typing, great ecosystem |
| **Styling** | Tailwind CSS | Rapid UI development, consistent design system |
| **State** | Zustand | Lightweight, simple, perfect for this scale |
| **File Watching** | chokidar | Battle-tested file system watcher |
| **CLI Bridge** | node-pty | Spawn and control terminal processes |
| **IPC** | Electron IPC | Main ↔ Renderer communication |

---

## Data Models

### Workspace (Repository)
```typescript
interface Workspace {
  id: string;                    // Derived from path hash
  name: string;                  // Repo folder name
  path: string;                  // Full path to repository
  claudeProjectPath: string;     // ~/.claude/projects/{encoded-path}
  sessions: Session[];
  color: string;                 // Visual identifier
  icon?: string;                 // Optional custom icon
  lastActivity: Date;
}
```

### Session
```typescript
interface Session {
  id: string;                    // UUID from Claude Code
  workspaceId: string;
  filePath: string;              // Path to .jsonl file
  status: 'active' | 'idle' | 'completed' | 'error';
  agents: Agent[];
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
  summary?: string;              // AI-generated summary of current task
  isControlled: boolean;         // Is this app controlling the session?
}
```

### Agent (Subagent)
```typescript
interface Agent {
  id: string;                    // e.g., "a6b6e8e"
  sessionId: string;
  name: string;                  // Derived from agent type
  type: 'main' | 'explore' | 'plan' | 'bash' | 'general-purpose';
  status: 'working' | 'idle' | 'completed';
  currentTask?: string;          // From todo list if available
  messageCount: number;
  lastActivity: Date;
}
```

### Message
```typescript
interface Message {
  uuid: string;
  parentUuid: string | null;
  sessionId: string;
  agentId?: string;              // For subagent messages
  role: 'user' | 'assistant';
  content: MessageContent[];
  timestamp: Date;
  isSidechain: boolean;
  tokenUsage?: TokenUsage;
}

type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: any }
  | { type: 'tool_result'; tool_use_id: string; content: string };
```

---

## Core Services

### 1. Session Discovery Service
```typescript
class SessionDiscoveryService {
  // Watch ~/.claude/projects for changes
  watchProjects(): void;

  // Scan and parse all existing sessions
  discoverSessions(): Promise<Session[]>;

  // Parse a single JSONL session file
  parseSessionFile(path: string): Promise<Session>;

  // Detect active sessions (recent file modifications)
  detectActiveSessions(): Session[];

  // Allow manual session registration
  registerSession(path: string): Promise<Session>;
}
```

### 2. CLI Bridge Service
```typescript
class CLIBridgeService {
  // Take over a session (spawn claude --resume)
  takeoverSession(sessionId: string): Promise<ControlledSession>;

  // Send a message to controlled session
  sendMessage(sessionId: string, message: string, mode: 'interrupt' | 'queue'): void;

  // Stream output from controlled session
  onOutput(sessionId: string, callback: (chunk: string) => void): void;

  // Release control (kill the spawned process)
  releaseSession(sessionId: string): void;

  // Fork session to new ID
  forkSession(sessionId: string): Promise<string>;
}
```

### 3. Real-time Sync Service
```typescript
class RealtimeSyncService {
  // Watch a session file for real-time updates
  watchSession(sessionId: string): void;

  // Parse incremental JSONL additions
  handleFileChange(path: string, stats: fs.Stats): void;

  // Emit events for UI updates
  onNewMessage(callback: (msg: Message) => void): void;
  onStatusChange(callback: (status: SessionStatus) => void): void;
}
```

---

## UI Components

### Main Layout
```
┌──────────────────────────────────────────────────────────────┐
│  Agent HQ                                    [+] [⚙️] [—][□][×]│
├────────────┬─────────────────────────────────────────────────┤
│            │                                                  │
│ WORKSPACES │              WORKSPACE VIEW                      │
│            │                                                  │
│ ▼ api-server│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│   ● Main    │  │ Session │ │ Session │ │ Session │          │
│   ○ Agent-1 │  │  #1     │ │  #2     │ │  #3     │          │
│             │  │ ● Active│ │ ○ Idle  │ │ ✓ Done  │          │
│ ▼ frontend  │  │         │ │         │ │         │          │
│   ● Main    │  │ 3 agents│ │ 1 agent │ │ 2 agents│          │
│             │  │ "Working│ │ "Waiting│ │ "Refac- │          │
│ ▶ ml-pipeline│ │  on API"│ │  input" │ │  tored" │          │
│             │  └─────────┘ └─────────┘ └─────────┘          │
│             │                                                  │
│ [+ Add]     │──────────────────────────────────────────────────│
│             │                                                  │
│             │              CHAT PANEL                          │
│             │  Session #1 - api-server                        │
│             │                                                  │
│             │  [Conversation history...]                      │
│             │                                                  │
│             │  ┌────────────────────────────────────────────┐ │
│             │  │ Type a message...                     [⏎] │ │
│             │  └────────────────────────────────────────────┘ │
│             │  [Interrupt] [Queue] [Take Control] [Fork]      │
└─────────────┴─────────────────────────────────────────────────┘
```

### Component Hierarchy
```
<App>
  <TitleBar />
  <MainLayout>
    <Sidebar>
      <WorkspaceList>
        <WorkspaceItem>
          <SessionBadge />
          <AgentList>
            <AgentItem status={status} />
          </AgentList>
        </WorkspaceItem>
      </WorkspaceList>
      <AddWorkspaceButton />
    </Sidebar>
    <MainContent>
      <WorkspaceView>
        <SessionGrid>
          <SessionCard>
            <StatusIndicator />
            <AgentAvatars />
            <TaskSummary />
          </SessionCard>
        </SessionGrid>
      </WorkspaceView>
      <ChatPanel>
        <ConversationHistory>
          <MessageBubble />
          <ToolCallDisplay />
          <AgentIndicator />
        </ConversationHistory>
        <ChatInput>
          <TextArea />
          <ActionButtons />
        </ChatInput>
      </ChatPanel>
    </MainContent>
  </MainLayout>
</App>
```

---

## Session Takeover Flow

```
User clicks "Take Control" on Session X
              │
              ▼
┌─────────────────────────────┐
│ Show confirmation dialog    │
│ "This will take control     │
│  from the original terminal"│
└──────────────┬──────────────┘
              │ Confirm
              ▼
┌─────────────────────────────┐
│ Spawn: claude --resume X    │
│        --output-format      │
│        stream-json          │
└──────────────┬──────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Attach PTY to chat panel    │
│ Stream output to UI         │
│ Mark session as controlled  │
└──────────────┬──────────────┘
              │
              ▼
┌─────────────────────────────┐
│ User can now send messages  │
│ via stdin to the process    │
└─────────────────────────────┘
```

---

## File Structure

```
agent-hq/
├── package.json
├── electron/
│   ├── main.ts                 # Electron main process
│   ├── preload.ts              # Preload script for IPC
│   └── services/
│       ├── SessionDiscovery.ts
│       ├── CLIBridge.ts
│       ├── RealtimeSync.ts
│       └── ConfigStore.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── stores/
│   │   ├── workspaceStore.ts
│   │   ├── sessionStore.ts
│   │   └── chatStore.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TitleBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainContent.tsx
│   │   ├── workspace/
│   │   │   ├── WorkspaceList.tsx
│   │   │   ├── WorkspaceItem.tsx
│   │   │   ├── SessionGrid.tsx
│   │   │   └── SessionCard.tsx
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── ConversationHistory.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ToolCallDisplay.tsx
│   │   │   └── ChatInput.tsx
│   │   └── shared/
│   │       ├── StatusIndicator.tsx
│   │       ├── AgentAvatar.tsx
│   │       └── Button.tsx
│   ├── hooks/
│   │   ├── useSession.ts
│   │   ├── useWorkspace.ts
│   │   └── useChat.ts
│   ├── utils/
│   │   ├── jsonlParser.ts
│   │   ├── sessionUtils.ts
│   │   └── pathUtils.ts
│   └── types/
│       └── index.ts
├── tailwind.config.js
├── tsconfig.json
└── electron-builder.json
```

---

## Implementation Phases

### Phase 1: Foundation (MVP Core)
- [ ] Electron + React + TypeScript scaffold
- [ ] Session discovery (scan ~/.claude/projects)
- [ ] JSONL parser for conversation history
- [ ] Basic UI: workspace list, session cards
- [ ] View conversation history (read-only)

### Phase 2: Real-time & Visualization
- [ ] File watcher for live updates
- [ ] Status detection (active/idle/completed)
- [ ] Agent visualization within sessions
- [ ] Task summary extraction from todos

### Phase 3: Interactive Control
- [ ] CLI bridge service (node-pty)
- [ ] Session takeover functionality
- [ ] Chat input with send capability
- [ ] Interrupt vs queue mode selection

### Phase 4: Polish & Features
- [ ] Manual workspace registration
- [ ] Session forking
- [ ] Search/filter sessions
- [ ] Keyboard shortcuts
- [ ] Settings panel
- [ ] Dark/light theme

---

## Key Technical Considerations

### 1. JSONL Streaming Parser
Since session files can be large, we need efficient streaming:
```typescript
async function* parseJSONLStream(filePath: string) {
  const stream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: stream });

  for await (const line of rl) {
    if (line.trim()) {
      yield JSON.parse(line);
    }
  }
}
```

### 2. File Watching Strategy
- Use chokidar for cross-platform file watching
- Debounce rapid changes (Claude writes frequently)
- Track file position to only read new content
- Handle file rotation/truncation

### 3. PTY Management
- Use node-pty for proper terminal emulation
- Handle ANSI escape codes in output
- Proper cleanup on session release
- Handle process crashes gracefully

### 4. IPC Security
- Validate all messages between main/renderer
- Don't expose raw file paths to renderer
- Sanitize any user input before CLI execution

---

## Configuration

Stored in `~/.config/agent-hq/config.json`:
```json
{
  "claudeConfigPath": "~/.claude",
  "manualWorkspaces": [
    { "path": "/path/to/repo", "name": "Custom Name" }
  ],
  "theme": "system",
  "defaultChatMode": "queue",
  "showCompletedSessions": true,
  "maxHistoryMessages": 500
}
```

---

## Future Enhancements

1. **Multi-machine sync** - View sessions from remote machines via SSH
2. **Session templates** - Quick-start sessions with predefined contexts
3. **Agent orchestration** - Coordinate multiple agents on related tasks
4. **Metrics dashboard** - Token usage, time tracking, productivity stats
5. **Voice commands** - "Hey Agent HQ, what's the status of the API refactor?"
6. **Mobile companion** - View session status from phone

---

## Getting Started (Next Steps)

1. Initialize the Electron + React project
2. Implement SessionDiscoveryService
3. Build the JSONL parser
4. Create basic UI shell
5. Wire up file watching
6. Add CLI bridge for takeover
7. Polish and test

Ready to start building?
