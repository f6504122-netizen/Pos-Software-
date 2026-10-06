import { useState } from 'react';
import {
  Download,
  Monitor,
  CheckCircle,
  FileArchive,
  FileCode,
  Copy,
  Laptop,
  X,
  Cpu,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import {
  generateWindowsZip,
  getCompileExeBatchScript,
  getWindowsHtaContent,
  getStandaloneOfflineHtml,
  getWindowsBatchScript,
  triggerFileDownload,
} from '../utils/windowsExport';
import { posSound } from '../utils/sound';

interface WindowsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pwaInstallPrompt: any; // BeforeInstallPromptEvent
}

export function WindowsExportModal({
  isOpen,
  onClose,
  pwaInstallPrompt,
}: WindowsExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAppUrl = window.location.href;

  const showFeedback = (msg: string) => {
    setDownloadMsg(msg);
    posSound.playCashChime();
    setTimeout(() => setDownloadMsg(null), 5000);
  };

  // 1. Download Build-EXE.bat which compiles CardsAndGiftsPOS.exe on Windows
  const handleDownloadExeBuilder = () => {
    posSound.playKeyClick();
    const script = getCompileExeBatchScript(currentAppUrl);
    triggerFileDownload(script, 'Build-CardsAndGiftsPOS-EXE.bat', 'application/x-bat');
    showFeedback('Downloaded "Build-CardsAndGiftsPOS-EXE.bat". Double-click it on Windows to compile and generate CardsAndGiftsPOS.exe!');
  };

  // 2. Download native Windows .HTA application
  const handleDownloadHta = () => {
    posSound.playKeyClick();
    const hta = getWindowsHtaContent(currentAppUrl);
    triggerFileDownload(hta, 'CardsAndGiftsPOS.hta', 'application/hta');
    showFeedback('Downloaded "CardsAndGiftsPOS.hta". Double-click on Windows to run as a native desktop executable offline!');
  };

  // 3. Download standalone 100% offline HTML
  const handleDownloadOfflineHtml = () => {
    posSound.playKeyClick();
    const html = getStandaloneOfflineHtml('Cards & Gifts Retail Store', 7.5, '$');
    triggerFileDownload(html, 'CardsAndGiftsPOS-Offline.html', 'text/html');
    showFeedback('Downloaded "CardsAndGiftsPOS-Offline.html". Runs 100% offline with zero internet needed!');
  };

  // 4. Download complete ZIP package
  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      posSound.playKeyClick();
      await generateWindowsZip(currentAppUrl);
      showFeedback('Downloaded complete offline Windows ZIP package!');
    } catch (err) {
      console.warn('Fallback to direct script', err);
      handleDownloadExeBuilder();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePwaInstall = async () => {
    if (pwaInstallPrompt) {
      pwaInstallPrompt.prompt();
      const choice = await pwaInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        posSound.playDiscountFanfare();
      }
    } else {
      alert('To install as an official Windows App in Edge or Chrome: click the App Install icon (screen with down arrow) in your browser address bar at the top right!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-slate-100 text-base">
              Windows Offline & Direct .EXE Downloader
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {/* Offline Banner */}
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5 flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <span className="font-bold text-amber-300 block text-sm mb-0.5">
                100% Offline Capability on Windows
              </span>
              <p className="text-slate-400 leading-relaxed">
                Run this POS completely offline in your cards and gifts store without an internet connection. Choose your preferred offline Windows executable format below:
              </p>
            </div>
          </div>

          {/* Feedback Toast */}
          {downloadMsg && (
            <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadMsg}</span>
            </div>
          )}

          {/* Option A: Direct .EXE Generator (Build-CardsAndGiftsPOS-EXE.bat) */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm text-slate-100">
                  Option 1: Windows Direct .EXE Builder
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Creates Native .EXE
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Downloads <code>Build-CardsAndGiftsPOS-EXE.bat</code>. Double-click it once on your Windows PC and it compiles a real, native <code>CardsAndGiftsPOS.exe</code> file directly onto your computer using Windows's built-in compiler!
            </p>

            <button
              type="button"
              onClick={handleDownloadExeBuilder}
              className="mt-1 w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download 1-Click .EXE Builder (Build-CardsAndGiftsPOS-EXE.bat)</span>
            </button>
          </div>

          {/* Option B: Native Windows HTA Executable (.hta) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-slate-200">
                  Option 2: Native Windows Executable (.hta)
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Direct Windows App
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Downloads <code>CardsAndGiftsPOS.hta</code>. Windows executes this directly as a standalone application using Windows <code>mshta.exe</code> with no browser borders.
            </p>

            <button
              type="button"
              onClick={handleDownloadHta}
              className="mt-1 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download CardsAndGiftsPOS.hta</span>
            </button>
          </div>

          {/* Option C: Standalone Offline Single-File HTML */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-sky-400" />
                <span className="font-bold text-sm text-slate-200">
                  Option 3: 100% Offline Standalone HTML
                </span>
              </div>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                Zero Dependencies
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Downloads <code>CardsAndGiftsPOS-Offline.html</code>. Completely self-contained POS terminal with 4-digit PIN lock screen, $0.00 keypad, 50% Off promo buttons, and receipt printing that works with ZERO internet required.
            </p>

            <button
              type="button"
              onClick={handleDownloadOfflineHtml}
              className="mt-1 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-sky-600/40 active:scale-95"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Download Standalone Offline HTML File</span>
            </button>
          </div>

          {/* Option D: Complete Offline Package ZIP */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm text-slate-200">
                  Option 4: Complete Offline ZIP Package
                </span>
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                All-In-One
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Contains the .EXE builder, .HTA executable, .bat runner, and offline HTML file all in one archive.
            </p>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadZip}
              className="mt-1 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Packaging...' : 'Download Complete Offline ZIP'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center text-xs text-slate-400">
          <span>Default Staff PIN: <strong className="text-amber-400 font-mono">1234</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
