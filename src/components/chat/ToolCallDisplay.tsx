import type { ToolUseContent, ToolResultContent } from '../../types';

interface ToolCallDisplayProps {
  toolUse: ToolUseContent;
  result?: ToolResultContent;
}

export function ToolCallDisplay({ toolUse, result }: ToolCallDisplayProps) {
  const isError = result?.is_error;

  return (
    <div className="my-2 border border-hq-border rounded-lg overflow-hidden">
      {/* Tool call header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-hq-surface border-b border-hq-border">
        <ToolIcon />
        <span className="font-medium text-sm text-hq-text">{toolUse.name}</span>
        {result && (
          <span
            className={`ml-auto text-xs px-2 py-0.5 rounded ${
              isError
                ? 'bg-hq-error/20 text-hq-error'
                : 'bg-hq-success/20 text-hq-success'
            }`}
          >
            {isError ? 'Error' : 'Success'}
          </span>
        )}
      </div>

      {/* Input */}
      {toolUse.input && Object.keys(toolUse.input).length > 0 && (
        <details className="border-b border-hq-border">
          <summary className="px-3 py-2 text-xs text-hq-text-muted cursor-pointer hover:bg-hq-surface/50">
            Input parameters
          </summary>
          <pre className="px-3 py-2 text-xs bg-hq-bg/50 overflow-x-auto">
            {JSON.stringify(toolUse.input, null, 2)}
          </pre>
        </details>
      )}

      {/* Result */}
      {result && (
        <details open={isError}>
          <summary className="px-3 py-2 text-xs text-hq-text-muted cursor-pointer hover:bg-hq-surface/50">
            {isError ? 'Error output' : 'Output'}
          </summary>
          <pre
            className={`px-3 py-2 text-xs overflow-x-auto max-h-60 ${
              isError ? 'bg-hq-error/10 text-hq-error' : 'bg-hq-bg/50'
            }`}
          >
            {typeof result.content === 'string'
              ? result.content
              : JSON.stringify(result.content, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function ToolIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-hq-accent"
    >
      <path d="M8.5 2.5l3 3-6 6-3.5.5.5-3.5 6-6z" />
    </svg>
  );
}
