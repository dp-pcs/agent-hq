import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';

interface ControlledSession {
  sessionId: string;
  process: ChildProcess;
  workingDir: string;
  isAlive: boolean;
}

export class CLIBridgeService extends EventEmitter {
  private controlledSessions: Map<string, ControlledSession> = new Map();

  constructor() {
    super();
  }

  async takeoverSession(sessionId: string, workingDir: string): Promise<boolean> {
    // Check if already controlled
    if (this.controlledSessions.has(sessionId)) {
      console.log(`Session ${sessionId} is already controlled`);
      return true;
    }

    try {
      // Use home directory if workingDir is not a valid path
      const cwd = workingDir && workingDir.startsWith('/') ? workingDir : process.env.HOME;

      console.log(`Taking over session ${sessionId} in ${cwd}`);

      // Spawn claude with --resume flag
      const claudeProcess = spawn('claude', [
        '--resume', sessionId,
      ], {
        cwd,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
      });

      const controlled: ControlledSession = {
        sessionId,
        process: claudeProcess,
        workingDir,
        isAlive: true,
      };

      this.controlledSessions.set(sessionId, controlled);

      // Handle stdout
      claudeProcess.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        this.emit('output', sessionId, chunk);
        this.parseStreamOutput(sessionId, chunk);
      });

      // Handle stderr
      claudeProcess.stderr?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        this.emit('error', sessionId, chunk);
      });

      // Handle process exit
      claudeProcess.on('close', (code) => {
        console.log(`Claude process for session ${sessionId} exited with code ${code}`);
        controlled.isAlive = false;
        this.emit('status-changed', sessionId, code === 0 ? 'completed' : 'error');
        this.controlledSessions.delete(sessionId);
      });

      claudeProcess.on('error', (err) => {
        console.error(`Error with Claude process for session ${sessionId}:`, err);
        controlled.isAlive = false;
        this.emit('status-changed', sessionId, 'error');
        this.controlledSessions.delete(sessionId);
      });

      this.emit('status-changed', sessionId, 'active');
      return true;
    } catch (err) {
      console.error(`Failed to take over session ${sessionId}:`, err);
      return false;
    }
  }

  sendMessage(sessionId: string, message: string, mode: 'interrupt' | 'queue'): void {
    const controlled = this.controlledSessions.get(sessionId);
    if (!controlled || !controlled.isAlive) {
      console.error(`Session ${sessionId} is not controlled or not alive`);
      return;
    }

    // For interrupt mode, we'd need to send SIGINT first
    // For now, we just write to stdin
    if (mode === 'interrupt') {
      // Send interrupt signal
      controlled.process.kill('SIGINT');
      // Wait a bit then send the message
      setTimeout(() => {
        controlled.process.stdin?.write(message + '\n');
      }, 100);
    } else {
      // Queue mode - just send the message
      controlled.process.stdin?.write(message + '\n');
    }
  }

  releaseSession(sessionId: string): void {
    const controlled = this.controlledSessions.get(sessionId);
    if (!controlled) {
      return;
    }

    if (controlled.isAlive) {
      // Send exit command or kill the process gracefully
      controlled.process.stdin?.write('/exit\n');

      // Give it a moment to exit gracefully
      setTimeout(() => {
        if (controlled.isAlive) {
          controlled.process.kill('SIGTERM');
        }
      }, 1000);
    }

    this.controlledSessions.delete(sessionId);
  }

  async forkSession(sessionId: string, workingDir: string): Promise<string> {
    // Fork creates a new session ID while continuing from the same point
    return new Promise((resolve, reject) => {
      const claudeProcess = spawn('claude', [
        '--resume', sessionId,
        '--fork-session',
        '--print',
        '--output-format', 'json',
      ], {
        cwd: workingDir,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';

      claudeProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      claudeProcess.on('close', (code) => {
        if (code === 0) {
          // Try to extract new session ID from output
          try {
            const parsed = JSON.parse(output);
            resolve(parsed.sessionId || sessionId);
          } catch {
            // If we can't parse, just return original session ID
            resolve(sessionId);
          }
        } else {
          reject(new Error(`Fork failed with code ${code}`));
        }
      });

      // Send an empty message to trigger the fork
      claudeProcess.stdin?.write('\n');
      claudeProcess.stdin?.end();
    });
  }

  releaseAll(): void {
    for (const [sessionId] of this.controlledSessions) {
      this.releaseSession(sessionId);
    }
  }

  isControlled(sessionId: string): boolean {
    return this.controlledSessions.has(sessionId);
  }

  private parseStreamOutput(sessionId: string, chunk: string): void {
    // Parse stream-json output format
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);

        // Emit structured events based on message type
        if (parsed.type === 'assistant') {
          this.emit('assistant-message', sessionId, parsed);
        } else if (parsed.type === 'tool_use') {
          this.emit('tool-use', sessionId, parsed);
        } else if (parsed.type === 'tool_result') {
          this.emit('tool-result', sessionId, parsed);
        }
      } catch {
        // Not JSON, might be plain text output
        // Just emit as raw output (already done above)
      }
    }
  }
}
