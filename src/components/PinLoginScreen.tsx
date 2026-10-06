import { useState, useEffect } from 'react';
import { Lock, Unlock, Store, Delete, AlertCircle, ShieldCheck } from 'lucide-react';
import { posSound } from '../utils/sound';

interface PinLoginScreenProps {
  expectedPin: string; // e.g. "1234"
  storeName: string;
  tagline: string;
  cashierName: string;
  registerId: string;
  onSuccess: () => void;
}

export function PinLoginScreen({
  expectedPin,
  storeName,
  tagline,
  cashierName,
  registerId,
  onSuccess,
}: PinLoginScreenProps) {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= 4) return;
    setErrorMsg(null);
    posSound.playKeyClick();
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);

    // If reached 4 digits, check immediately
    if (nextPin.length === 4) {
      if (nextPin === expectedPin) {
        posSound.playDiscountFanfare();
        setTimeout(() => {
          onSuccess();
        }, 150);
      } else {
        posSound.playErrorBeep();
        setErrorMsg(`Incorrect PIN. (Default PIN: ${expectedPin})`);
        setIsShaking(true);
        setTimeout(() => {
          setIsShaking(false);
          setEnteredPin('');
        }, 600);
      }
    }
  };

  const handleBackspace = () => {
    posSound.playKeyClick();
    setErrorMsg(null);
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    posSound.playKeyClick();
    setErrorMsg(null);
    setEnteredPin('');
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enteredPin, expectedPin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 select-none">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-3xl max-w-sm w-full p-8 shadow-2xl flex flex-col items-center gap-6 backdrop-blur-md">
        {/* Store Brand & Lock Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg mb-3">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-black text-slate-100 tracking-tight uppercase">
            {storeName}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{tagline}</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1">
            <span>Register: {registerId}</span>
            <span>•</span>
            <span>Staff: {cashierName}</span>
          </div>
        </div>

        {/* PIN Dots Indicator */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Enter 4-Digit Security PIN
          </span>

          <div
            className={`flex items-center gap-3 py-2 ${
              isShaking ? 'animate-bounce text-rose-500' : ''
            }`}
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = enteredPin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    isFilled
                      ? 'bg-amber-400 scale-125 shadow-md shadow-amber-500/50 ring-2 ring-amber-300'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg ? (
            <div className="text-xs text-rose-400 font-semibold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 font-medium mt-1">
              Default code: <strong className="text-slate-300 font-mono">1234</strong>
            </span>
          )}
        </div>

        {/* Touch / Clickable Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-850 hover:bg-slate-750 active:scale-95 border border-slate-750 text-slate-100 font-mono font-bold text-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-rose-950/60 active:scale-95 border border-slate-700/60 text-slate-400 hover:text-rose-400 font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center"
            title="Clear PIN"
          >
            CLEAR
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-850 hover:bg-slate-750 active:scale-95 border border-slate-750 text-slate-100 font-mono font-bold text-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center"
            title="Delete last digit"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Security Footer */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Staff authentication required for register operation</span>
        </div>
      </div>
    </div>
  );
}
