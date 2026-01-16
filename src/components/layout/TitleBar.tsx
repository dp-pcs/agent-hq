import { useState, useEffect } from 'react';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => {
    window.electronAPI.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI.maximizeWindow();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI.closeWindow();
  };

  return (
    <div className="h-12 bg-hq-surface border-b border-hq-border flex items-center justify-between px-4 drag-region">
      {/* macOS traffic lights space */}
      <div className="w-20" />

      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">HQ</span>
        </div>
        <span className="font-semibold text-hq-text">Agent HQ</span>
      </div>

      {/* Window controls (for non-macOS) */}
      <div className="flex items-center gap-1 no-drag">
        {process.platform !== 'darwin' && (
          <>
            <button
              onClick={handleMinimize}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-hq-border transition-colors"
            >
              <MinusIcon />
            </button>
            <button
              onClick={handleMaximize}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-hq-border transition-colors"
            >
              {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-500/20 hover:text-red-400 transition-colors"
            >
              <CloseIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MinusIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 6h8" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="2" width="8" height="8" rx="1" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <path d="M5 3V2h5v5h-1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 2l8 8M10 2l-8 8" />
    </svg>
  );
}
