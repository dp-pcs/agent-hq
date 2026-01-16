# Agent HQ

A visual command center for managing Claude Code sessions across multiple repositories.

![Agent HQ](https://via.placeholder.com/800x450?text=Agent+HQ+Screenshot)

## Features

- **Session Discovery**: Automatically discovers all your Claude Code sessions from `~/.claude/projects/`
- **Visual Workspace View**: See all your repositories and their active sessions at a glance
- **Full Conversation History**: View the complete message history for any session
- **Real-time Updates**: Watch sessions update in real-time as Claude Code works
- **Session Takeover**: Take control of any session directly from the app
- **Agent Visualization**: See all agents (main + subagents) and their status
- **Interactive Chat**: Send messages to sessions with queue or interrupt mode

## Prerequisites

- **Node.js** 18+
- **Claude Code CLI** installed and configured (`claude` command available)
- **macOS** (Windows/Linux support coming soon)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agent-hq.git
cd agent-hq

# Install dependencies
npm install

# Build the Electron main process
npm run build:electron

# Start in development mode
npm run dev
```

## Development

```bash
# Run in development mode (hot-reload enabled)
npm run dev

# Build for production
npm run build

# Build only Vite (renderer)
npm run build:vite

# Build only Electron (main process)
npm run build:electron
```

## Project Structure

```
agent-hq/
├── electron/              # Electron main process
│   ├── main.ts           # Main entry point
│   ├── preload.ts        # Preload script for IPC
│   └── services/
│       ├── SessionDiscovery.ts   # Discovers Claude Code sessions
│       ├── CLIBridge.ts          # Manages CLI communication
│       └── RealtimeSync.ts       # Real-time file watching
├── src/                  # React renderer
│   ├── App.tsx
│   ├── components/
│   │   ├── layout/       # TitleBar, Sidebar, MainContent
│   │   ├── workspace/    # SessionGrid, SessionCard
│   │   ├── chat/         # ChatPanel, ConversationHistory, MessageBubble
│   │   └── shared/       # StatusIndicator, AgentAvatar, Button
│   ├── stores/           # Zustand state management
│   └── types/            # TypeScript types
└── package.json
```

## How It Works

### Session Discovery
Agent HQ scans `~/.claude/projects/` for session files (`.jsonl`). Each session contains:
- Full conversation history
- Tool calls and results
- Subagent conversations
- Token usage stats

### Session Takeover
When you "Take Control" of a session:
1. Agent HQ spawns `claude --resume <session-id>`
2. Output streams to the chat panel
3. You can send messages directly to the session
4. The original terminal loses control (takeover model)

### Real-time Updates
Using `chokidar`, Agent HQ watches for file changes and:
- Detects new messages as they're written
- Updates session status based on activity
- Discovers new sessions automatically

## Configuration

Configuration is stored in `~/.config/agent-hq/config.json`:

```json
{
  "claudeConfigPath": "~/.claude",
  "manualWorkspaces": [],
  "theme": "dark",
  "defaultChatMode": "queue",
  "showCompletedSessions": true,
  "maxHistoryMessages": 500
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line in message |
| `Escape` | Close chat panel |
| `Cmd+K` | Clear current session (when controlled) |

## Troubleshooting

### Sessions not appearing
- Make sure Claude Code is installed: `claude --version`
- Check that `~/.claude/projects/` exists
- Try running a Claude Code session to create the directory structure

### Can't take control of session
- The `claude` command must be in your PATH
- Check that the session file still exists
- Note: Only one app can control a session at a time

### Real-time updates not working
- Check file permissions on `~/.claude`
- Try restarting the app

## Roadmap

- [ ] Windows/Linux support
- [ ] Session search and filtering
- [ ] Custom workspace colors/icons
- [ ] Session forking
- [ ] Keyboard shortcut customization
- [ ] Dark/light theme toggle
- [ ] Export conversation history
- [ ] Session templates

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines first.
