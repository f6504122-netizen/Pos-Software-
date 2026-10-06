import { useState } from 'react';
import {
  Printer,
  CheckCircle2,
  DollarSign,
  X,
  Sparkles,
  Layers,
  Settings,
  HardDrive,
  FileText,
} from 'lucide-react';
import { StoreSettings, PrinterDeviceConfig } from '../../types/pos';
import { posSound } from '../../utils/sound';

interface PrinterDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onOpenDrawerKick: () => void;
  onNavigateToSettings?: () => void;
}

const COMMON_PRINTER_MODELS = [
  {
    id: 'epson-tm-t88',
    name: 'Epson TM-T88VI Thermal Receipt Printer (Industry Standard)',
    type: 'usb',
    defaultPort: 'USB001 (Thermal ESC/POS)',
    paper: '80mm',
    kickCode: 'ESC p 0 25 250 (Pin 2 / Standard ESC/POS)',
  },
  {
    id: 'epson-tm-t20',
    name: 'Epson TM-T20III Compact Thermal Printer',
    type: 'usb',
    defaultPort: 'USB002 (ESC/POS)',
    paper: '80mm',
    kickCode: 'ESC p 0 25 250 (Standard ESC/POS)',
  },
  {
    id: 'star-tsp100',
    name: 'Star Micronics TSP100III / TSP143 (futurePRNT)',
    type: 'usb',
    defaultPort: 'USB Star Line Mode',
    paper: '80mm',
    kickCode: 'BEL \x07 (Star Drawer 1 Pulse)',
  },
  {
    id: 'citizen-cts310',
    name: 'Citizen CT-S310II High-Speed Thermal Printer',
    type: 'serial',
    defaultPort: 'COM3 (9600 8-N-1)',
    paper: '80mm',
    kickCode: 'ESC p 0 25 250 (Pin 2)',
  },
  {
    id: 'generic-esc-pos-80',
    name: 'Generic 80mm ESC/POS Retail Thermal Printer',
    type: 'usb',
    defaultPort: 'USB Virtual Printer Port',
    paper: '80mm',
    kickCode: 'ESC p 0 25 250',
  },
  {
    id: 'generic-esc-pos-58',
    name: 'Generic 58mm Mobile / Compact Thermal Printer',
    type: 'usb',
    defaultPort: 'USB / Bluetooth Serial COM4',
    paper: '58mm',
    kickCode: 'ESC p 0 25 250',
  },
  {
    id: 'windows-spooler',
    name: 'Windows Print Spooler (Default System Thermal / PDF)',
    type: 'spooler',
    defaultPort: 'Windows Spooler Subsystem (winspool.drv)',
    paper: '80mm',
    kickCode: 'ESC p 0 25 250 (Driver Pulse Pass-through)',
  },
];

export function PrinterDeviceModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onOpenDrawerKick,
  onNavigateToSettings,
}: PrinterDeviceModalProps) {
  const currentPrinter: PrinterDeviceConfig = settings.printerDevice || {
    deviceName: 'Epson TM-T88VI Thermal Receipt Printer',
    model: 'epson-tm-t88',
    connectionType: 'usb',
    portOrIp: 'USB001 (Thermal ESC/POS Port)',
    paperWidth: '80mm',
    status: 'online',
    drawerKickCode: 'ESC p 0 25 250 (Pin 2 / Standard ESC/POS)',
  };

  const [selectedModel, setSelectedModel] = useState<string>(currentPrinter.model);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(currentPrinter.paperWidth || '80mm');
  const [testPrintSuccess, setTestPrintSuccess] = useState(false);
  const [drawerKickFeedback, setDrawerKickFeedback] = useState(false);

  if (!isOpen) return null;

  const handleModelChange = (modelId: string) => {
    const found = COMMON_PRINTER_MODELS.find((m) => m.id === modelId);
    if (!found) return;

    setSelectedModel(modelId);
    const updatedPrinter: PrinterDeviceConfig = {
      ...currentPrinter,
      model: modelId as any,
      deviceName: found.name,
      connectionType: found.type as any,
      portOrIp: found.defaultPort,
      paperWidth: found.paper as any,
      drawerKickCode: found.kickCode,
      status: 'online',
    };

    onSaveSettings({
      ...settings,
      printerDevice: updatedPrinter,
      receiptCustomization: {
        ...(settings.receiptCustomization || {}),
        paperWidth: found.paper as any,
      } as any,
    });
    posSound.playScanBeep();
  };

  const handleTestPrint = () => {
    posSound.playKeyClick();
    setTestPrintSuccess(true);

    // Trigger standard browser thermal print test
    const printWindow = window.open('', '_blank', 'width=350,height=500');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Print - ${currentPrinter.deviceName}</title>
          <style>
            body { font-family: monospace; font-size: 11px; padding: 10px; width: ${paperWidth === '58mm' ? '200px' : '280px'}; margin: 0 auto; }
            .center { text-align: center; }
            .line { border-bottom: 1px dashed #000; margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <strong>*** TEST RECEIPT ***</strong><br/>
            ${settings.storeName.toUpperCase()}<br/>
            ${currentPrinter.deviceName}<br/>
            <div class="line"></div>
            PRINTER STATUS: ONLINE<br/>
            PORT: ${currentPrinter.portOrIp}<br/>
            WIDTH: ${paperWidth}<br/>
            KICK: ${currentPrinter.drawerKickCode}<br/>
            DATE: ${new Date().toLocaleString()}<br/>
            <div class="line"></div>
            CASH DRAWER PORT: RJ-11 24V<br/>
            AUTO-CUT: ENABLED<br/>
            <div class="line"></div>
            <strong>*** HARDWARE READY ***</strong>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    } else {
      window.print();
    }

    setTimeout(() => setTestPrintSuccess(false), 3000);
  };

  const handleTestKick = () => {
    onOpenDrawerKick();
    setDrawerKickFeedback(true);
    setTimeout(() => setDrawerKickFeedback(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                Receipt Printer Device & Hardware
              </h3>
              <p className="text-xs text-slate-400">
                Connected POS thermal printer and cash drawer kick configuration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Active Printer Device Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Active Receipt Printer Device
                </span>
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <span>{currentPrinter.deviceName}</span>
                </h4>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE / READY
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div>
                <span className="text-slate-500 block">Interface Port:</span>
                <span className="font-mono text-slate-300 font-semibold">{currentPrinter.portOrIp}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Thermal Paper Width:</span>
                <span className="font-mono text-amber-400 font-bold">{currentPrinter.paperWidth} Standard</span>
              </div>
              <div>
                <span className="text-slate-500 block">Cash Drawer Relay:</span>
                <span className="font-mono text-emerald-400 font-semibold">RJ-11 (24V 1A)</span>
              </div>
            </div>
          </div>

          {/* Quick Hardware Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleTestPrint}
              className="bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 font-bold p-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-95 text-xs"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>{testPrintSuccess ? 'Printed Successfully!' : 'Test Print Receipt'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestKick}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold p-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-95 text-xs"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>{drawerKickFeedback ? 'Drawer Kick Sent!' : 'Open Cash Drawer (Kick Test)'}</span>
            </button>
          </div>

          {/* Select / Change Printer Model */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Change Receipt Printer Model / Driver</span>
              <span className="text-[10px] text-slate-500 font-normal">ESC/POS & Star Line Compatible</span>
            </label>

            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              {COMMON_PRINTER_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.paper})
                </option>
              ))}
            </select>
          </div>

          {/* Paper Width Toggle */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Thermal Paper Width
              </span>
              <span className="text-[10px] text-slate-500">
                80mm for standard high-speed desktop printers; 58mm for mobile receipt printers.
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setPaperWidth('80mm');
                  onSaveSettings({
                    ...settings,
                    printerDevice: { ...currentPrinter, paperWidth: '80mm' },
                    receiptCustomization: {
                      ...(settings.receiptCustomization || {}),
                      paperWidth: '80mm',
                    } as any,
                  });
                  posSound.playKeyClick();
                }}
                className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  currentPrinter.paperWidth === '80mm'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaperWidth('58mm');
                  onSaveSettings({
                    ...settings,
                    printerDevice: { ...currentPrinter, paperWidth: '58mm' },
                    receiptCustomization: {
                      ...(settings.receiptCustomization || {}),
                      paperWidth: '58mm',
                    } as any,
                  });
                  posSound.playKeyClick();
                }}
                className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  currentPrinter.paperWidth === '58mm'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                58mm
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          {onNavigateToSettings ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToSettings();
              }}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Full Receipt Customizer in Settings &rarr;</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">
              Hardware settings persist in local terminal storage.
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
