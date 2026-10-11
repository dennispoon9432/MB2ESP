import React from 'react';
import { X, Bluetooth, Smartphone, HelpCircle, CheckCircle2 } from 'lucide-react';
import { AppStrings } from '../i18n/strings';

interface PairingHelpModalProps {
  onClose: () => void;
  strings: AppStrings;
}

export const PairingHelpModal: React.FC<PairingHelpModalProps> = ({ onClose, strings }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99999] app-modal-overlay flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-950/80 border border-sky-500/40 flex items-center justify-center">
              <Bluetooth className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{strings.pairingHelpTitle}</h2>
              <p className="text-xs text-slate-400">Bluetooth BLE Connection Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Illustrated Steps */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white block mb-0.5">Power on your board</span>
              {strings.pairingStep1}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-2xl border border-amber-600/30 bg-amber-950/10">
            <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-amber-300 block mb-0.5">Enter Bluetooth Pairing Mode</span>
              {strings.pairingStep2}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white block mb-0.5">Read Board ID on Screen</span>
              {strings.pairingStep3}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white block mb-0.5">Upload via Bluetooth</span>
              {strings.pairingStep4}
            </div>
          </div>
        </div>

        {/* Prototype note */}
        <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{strings.pairingPrototypeNote}</span>
        </div>

        {/* USB Help */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{strings.pairingUsbHelp}</span>
        </div>

        {/* Note banner */}
        <div className="p-3 bg-sky-950/40 border border-sky-800/60 rounded-xl text-sky-200 text-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              The board advertises with its 6-character hex ID (e.g. <strong className="text-white font-mono">A96E08</strong>) and uses Nordic UART Service.
            </span>
          </div>
          <span className="text-[11px] text-sky-300/80 pl-6">
            In a classroom with up to 30 boards, enter your board's 6 characters into the <strong>Board ID</strong> field so Chrome matches only your board.
          </span>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
