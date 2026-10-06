import { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Shield, WifiOff } from 'lucide-react';
import { posSound } from '../utils/sound';

interface WindowsTitleBarProps {
  storeName: string;
  registerId: string;
  onLock: () => void;
  onOpenWindowsModal: () => void;
}

export function WindowsTitleBar({
  storeName,
  registerId,
  onLock,
  onOpenWindowsModal,
}: WindowsTitleBarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    posSound.playKeyClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleMinimize = () => {
    posSound.playKeyClick();
    alert('Minimizing to Windows Taskbar. To restore, click this window in your taskbar or press Alt+Tab.');
  };

  const handleClose = () => {
    posSound.playKeyClick();
    if (window.confirm('Lock register and return to 4-digit PIN login screen?')) {
      onLock();
    }
  };

  return (
    <div className="h-8 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-3 text-xs select-none shrink-0 z-40">
      {/* Left: Windows App Icon & System Title */}
      <div className="flex items-center gap-2">
        {/* Windows 4-color style logo */}
        <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
          <div className="bg-sky-500 rounded-[1px]" />
          <div className="bg-sky-400 rounded-[1px]" />
          <div className="bg-sky-400 rounded-[1px]" />
          <div className="bg-sky-300 rounded-[1px]" />
        </div>

        <span className="font-semibold text-slate-300 text-[11px] tracking-tight">
          {storeName} — Windows Retail POS (Offline Native Edition)
        </span>

        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20">
          <WifiOff className="w-2.5 h-2.5" />
          OFFLINE READY
        </span>
      </div>

      {/* Center: System Status */}
      <div className="hidden md:flex items-center gap-3 text-[10px] font-mono text-slate-500">
        <span>Windows x64 Terminal</span>
        <span>•</span>
        <span>Reg: {registerId}</span>
        <span>•</span>
        <button
          type="button"
          onClick={onOpenWindowsModal}
          className="text-amber-400 hover:underline cursor-pointer"
        >
          [Build / Download .EXE]
        </button>
      </div>

      {/* Right: Windows Minimize / Maximize / Close Control Buttons */}
      <div className="flex items-center h-full -mr-3">
        {/* Minimize */}
        <button
          type="button"
          onClick={handleMinimize}
          className="h-8 w-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Minimize Window"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Maximize / Restore */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="h-8 w-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title={isFullscreen ? 'Restore Window Size' : 'Maximize to Fullscreen'}
        >
          {isFullscreen ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        {/* Close (Lock) */}
        <button
          type="button"
          onClick={handleClose}
          className="h-8 w-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition cursor-pointer"
          title="Lock / Exit POS (Requires 4-Digit PIN)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
