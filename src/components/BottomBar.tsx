import React from 'react';
import { Bluetooth, Download, HelpCircle, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { BluetoothState } from '../services/bluetooth';
import { AppStrings } from '../i18n/strings';

interface BottomBarProps {
  bluetoothState: BluetoothState;
  onConnect: () => void;
  onDisconnect: () => void;
  onFlash: () => void;
  onOpenPairingHelp: () => void;
  onToggleSerial: () => void;
  isSerialOpen: boolean;
  strings: AppStrings;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  bluetoothState,
  onConnect,
  onDisconnect,
  onFlash,
  onOpenPairingHelp,
  onToggleSerial,
  isSerialOpen,
  strings
}) => {
  const isConnected = bluetoothState.status === 'connected';
  const isFlashing = bluetoothState.status === 'flashing';
  const isConnecting = bluetoothState.status === 'connecting';

  return (
    <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-20">
      {/* Left Action Buttons: Big Connect and Big Flash */}
      <div className="flex items-center gap-3">
        {/* Big Flash / Download Button */}
        <div className="relative">
          <button
            onClick={onFlash}
            disabled={isFlashing}
            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-lg active:scale-95 touch-manipulation ${
              isFlashing
                ? 'bg-amber-600 text-white cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            <Download className={`w-5 h-5 ${isFlashing ? 'animate-bounce' : ''}`} />
            <span>{isFlashing ? strings.flashing : strings.flash}</span>
          </button>

          {/* Upload Progress Bar */}
          {isFlashing && (
            <div className="absolute -top-3 left-0 right-0 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-amber-400 h-full transition-all duration-200"
                style={{ width: `${bluetoothState.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Big Connect / Disconnect Button */}
        {isConnected ? (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 shadow">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-200">
                {strings.connectedTo} <span className="text-emerald-400">{bluetoothState.deviceName}</span>
              </span>
            </div>
            <button
              onClick={onDisconnect}
              className="ml-2 px-2 py-1 bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 text-xs rounded transition"
            >
              {strings.disconnect}
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="px-4 py-3 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition shadow-lg shadow-indigo-950/40 active:scale-95 touch-manipulation disabled:opacity-50"
          >
            <Bluetooth className={`w-5 h-5 ${isConnecting ? 'animate-pulse' : ''}`} />
            <span>{isConnecting ? strings.connecting : strings.connect}</span>
          </button>
        )}

        {/* Status indicator message */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          {bluetoothState.status === 'flashing' ? (
            <span className="text-amber-400 font-mono font-medium">{bluetoothState.statusMessage}</span>
          ) : bluetoothState.status === 'connected' ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready to flash</span>
            </span>
          ) : bluetoothState.status === 'error' ? (
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{bluetoothState.statusMessage}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Pairing Help */}
        <button
          onClick={onOpenPairingHelp}
          className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition active:scale-95 touch-manipulation"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">{strings.pairingHelp}</span>
        </button>

        {/* Serial Console Toggle */}
        <button
          onClick={onToggleSerial}
          className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition active:scale-95 touch-manipulation ${
            isSerialOpen
              ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>{strings.serialConsole}</span>
        </button>
      </div>
    </div>
  );
};
