import React, { useState } from 'react';
import { 
  Delete, 
  RotateCcw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  FileText 
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

// Subtle Web Audio click synthesizer for tactile mobile feedback
const playTactileFeedback = () => {
  try {
    if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {
    // Ignore audio restrictions
  }
};

export const Keypad = ({
  activeMember,
  onSubmitTransaction,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [noteStr, setNoteStr] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [feedbackAnimation, setFeedbackAnimation] = useState(null); // 'GOT' or 'GAVE'

  // Numeric keypad inputs
  const handleKeyPress = (val) => {
    playTactileFeedback();
    if (val === 'CLEAR') {
      setAmountStr('');
      return;
    }

    if (val === 'BACKSPACE') {
      setAmountStr((prev) => prev.slice(0, -1));
      return;
    }

    if (val === '.') {
      if (amountStr.includes('.')) return;
      setAmountStr((prev) => (prev ? `${prev}.` : '0.'));
      return;
    }

    if (val === '00') {
      if (!amountStr || amountStr === '0') return;
      if (amountStr.length >= 8) return;
      setAmountStr((prev) => `${prev}00`);
      return;
    }

    // Limit length to realistic maximum (8 digits)
    if (amountStr.length >= 8) return;

    if (amountStr === '0' && val !== '.') {
      setAmountStr(val);
    } else {
      setAmountStr((prev) => `${prev}${val}`);
    }
  };

  // Quick Preset Additions
  const addQuickAmount = (delta) => {
    playTactileFeedback();
    const current = parseFloat(amountStr) || 0;
    const nextVal = current + delta;
    setAmountStr(String(nextVal));
  };

  // Submission handler
  const handleAction = async (type) => {
    playTactileFeedback();
    const num = parseFloat(amountStr);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid amount before saving.');
      return;
    }

    if (!activeMember) {
      alert('Please select or add a member first.');
      return;
    }

    setFeedbackAnimation(type);
    try {
      await onSubmitTransaction({
        member_id: activeMember.id,
        amount: num,
        type, // 'GOT' or 'GAVE'
        note: noteStr,
        timestamp: new Date().toISOString(), // exact current Date & Time down to minute
      });

      // Reset display
      setAmountStr('');
      setNoteStr('');
    } finally {
      setTimeout(() => setFeedbackAnimation(null), 400);
    }
  };

  const parsedDisplayAmount = parseFloat(amountStr) || 0;

  return (
    <div className="sticky bottom-0 z-30 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)]">
      {/* Keypad Header & Collapser Bar */}
      <div className="max-w-md mx-auto px-4 pt-1.5 pb-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Fast Entry Pad
          </span>
          {activeMember && (
            <span className="text-[11px] text-emerald-400 font-semibold truncate max-w-[140px]">
              → for {activeMember.name}
            </span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1 text-[11px] transition"
        >
          <span>{isCollapsed ? 'Show Keypad' : 'Hide'}</span>
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="max-w-md mx-auto px-3 pb-3">
          {/* Display Area Above Keypad: Amount Display & Note Field */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-2.5 mb-2 shadow-inner">
            {/* Amount Visualizer */}
            <div className="flex items-baseline justify-between mb-1.5 px-1">
              <span className="text-xs font-semibold text-slate-400">Amount</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-bold text-slate-400">₹</span>
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight transition-all ${
                    amountStr ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {amountStr ? Number(amountStr).toLocaleString('en-IN') : '0'}
                </span>
              </div>
            </div>

            {/* Optional Quick Notes Field */}
            <div className="relative flex items-center">
              <FileText className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={noteStr}
                onChange={(e) => setNoteStr(e.target.value)}
                placeholder="Add note (e.g. Rice & Flour, Bill #102, UPI payment)..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Quick Note & Amount Suggestion Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-2">
              <button
                onClick={() => addQuickAmount(100)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 flex-shrink-0 active:scale-95 transition"
              >
                +₹100
              </button>
              <button
                onClick={() => addQuickAmount(500)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 flex-shrink-0 active:scale-95 transition"
              >
                +₹500
              </button>
              <button
                onClick={() => addQuickAmount(1000)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 flex-shrink-0 active:scale-95 transition"
              >
                +₹1,000
              </button>
              <button
                onClick={() => addQuickAmount(2000)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 flex-shrink-0 active:scale-95 transition"
              >
                +₹2,000
              </button>
              <button
                onClick={() => setNoteStr('Cash Settlement')}
                className="px-2 py-0.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-[10px] font-medium border border-slate-700/60 flex-shrink-0"
              >
                Cash
              </button>
              <button
                onClick={() => setNoteStr('UPI Online Transfer')}
                className="px-2 py-0.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-[10px] font-medium border border-slate-700/60 flex-shrink-0"
              >
                UPI
              </button>
            </div>
          </div>

          {/* Virtual Numeric Keypad Grid (0–9, 00, Clear, Backspace) */}
          <div className="grid grid-cols-4 gap-1.5 mb-2.5">
            {['1', '2', '3'].map((n) => (
              <button
                key={n}
                onClick={() => handleKeyPress(n)}
                className="h-11 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-bold text-lg hover:bg-slate-800 active:scale-95 active:bg-slate-700 transition flex items-center justify-center shadow-sm select-none"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => handleKeyPress('BACKSPACE')}
              className="h-11 rounded-xl bg-slate-850 border border-slate-750 text-slate-300 hover:text-rose-400 hover:bg-slate-800 active:scale-95 transition flex items-center justify-center select-none"
              title="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>

            {['4', '5', '6'].map((n) => (
              <button
                key={n}
                onClick={() => handleKeyPress(n)}
                className="h-11 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-bold text-lg hover:bg-slate-800 active:scale-95 active:bg-slate-700 transition flex items-center justify-center shadow-sm select-none"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => handleKeyPress('CLEAR')}
              className="h-11 rounded-xl bg-slate-850 border border-slate-750 text-amber-400 font-bold text-xs uppercase hover:bg-slate-800 active:scale-95 transition flex items-center justify-center select-none"
              title="Clear All"
            >
              <RotateCcw className="w-4 h-4 mr-0.5" />
              <span>C</span>
            </button>

            {['7', '8', '9'].map((n) => (
              <button
                key={n}
                onClick={() => handleKeyPress(n)}
                className="h-11 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-bold text-lg hover:bg-slate-800 active:scale-95 active:bg-slate-700 transition flex items-center justify-center shadow-sm select-none"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => handleKeyPress('.')}
              className="h-11 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-bold text-lg hover:bg-slate-800 active:scale-95 transition flex items-center justify-center select-none"
            >
              •
            </button>

            <button
              onClick={() => handleKeyPress('00')}
              className="h-11 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 font-bold text-base hover:bg-slate-800 active:scale-95 transition flex items-center justify-center select-none"
            >
              00
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              className="col-span-2 h-11 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-bold text-lg hover:bg-slate-800 active:scale-95 transition flex items-center justify-center select-none"
            >
              0
            </button>
            <div className="h-11 rounded-xl bg-slate-950 border border-slate-800/40 flex items-center justify-center text-slate-600 text-[10px] uppercase font-bold select-none">
              INR
            </div>
          </div>

          {/* Two Primary Touch Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* GREEN + GOT (Received) */}
            <button
              onClick={() => handleAction('GOT')}
              disabled={!activeMember}
              className={`h-12 rounded-xl flex items-center justify-center space-x-2 text-white font-extrabold text-sm sm:text-base shadow-lg transition-all active:scale-95 ${
                feedbackAnimation === 'GOT'
                  ? 'bg-emerald-400 scale-95 ring-4 ring-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              } ${!activeMember ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ArrowDownLeft className="w-5 h-5" />
              <span>+ GOT (Received)</span>
            </button>

            {/* RED - GAVE (Given) */}
            <button
              onClick={() => handleAction('GAVE')}
              disabled={!activeMember}
              className={`h-12 rounded-xl flex items-center justify-center space-x-2 text-white font-extrabold text-sm sm:text-base shadow-lg transition-all active:scale-95 ${
                feedbackAnimation === 'GAVE'
                  ? 'bg-rose-400 scale-95 ring-4 ring-rose-300'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              } ${!activeMember ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>- GAVE (Given)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
