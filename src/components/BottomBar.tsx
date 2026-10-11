import React from 'react';
import { Bluetooth, Download, HelpCircle, Terminal, CheckCircle2, AlertCircle, Usb } from 'lucide-react';
import { BluetoothState } from '../services/bluetooth';
import { USBSerialState } from '../services/usbSerial';
import { AppStrings } from '../i18n/strings';

interface BottomBarProps {
  bluetoothState: BluetoothState;
  onConnect: () => void;
  onDisconnect: () => void;
  usbState: USBSerialState;
  onConnectUsb: () => void;
  onDisconnectUsb: () => void;
  isUsbSupported: boolean;
  onFlash: () => void;
  onOpenPairingHelp: () => void;
  onToggleSerial: () => void;
  isSerialOpen: boolean;
  strings: AppStrings;
  targetBoardId?: string;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  bluetoothState,
  onConnect,
  onDisconnect,
  usbState,
  onConnectUsb,
  onDisconnectUsb,
  isUsbSupported,
  onFlash,
  onOpenPairingHelp,
  onToggleSerial,
  isSerialOpen,
  strings,
  targetBoardId
}) => {
  const isBleConnected = bluetoothState.status === 'connected';
  const isUsbConnected = usbState.status === 'connected';
  const isFlashing = bluetoothState.status === 'flashing' || usbState.status === 'flashing';
  const isBleConnecting = bluetoothState.status === 'connecting';
  const isUsbConnecting = usbState.status === 'connecting';

  const flashProgress = usbState.status === 'flashing' ? usbState.progress : bluetoothState.progress;
  const activeStatusMsg = usbState.status === 'flashing'
    ? usbState.statusMessage
    : bluetoothState.status === 'flashing'
    ? bluetoothState.statusMessage
    : isUsbConnected
    ? usbState.statusMessage
    : isBleConnected
    ? bluetoothState.statusMessage
    : null;

  return (
    <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-20">
      {/* Left Action Buttons: Flash, Connect BLE, Connect USB */}
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
                style={{ width: `${flashProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Big Connect / Disconnect Bluetooth */}
        {isBleConnected ? (
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
            disabled={isBleConnecting}
            className="px-4 py-3 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition shadow-lg shadow-indigo-950/40 active:scale-95 touch-manipulation disabled:opacity-50"
            title={targetBoardId ? `Connect to PIXL-${targetBoardId}` : "Connect over Web Bluetooth BLE"}
          >
            <Bluetooth className={`w-5 h-5 ${isBleConnecting ? 'animate-pulse' : ''}`} />
            <div className="flex flex-col items-start leading-none">
              <span>{isBleConnecting ? strings.connecting : strings.connect}</span>
              {targetBoardId && (
                <span className="text-[10px] font-mono text-indigo-200 font-normal mt-0.5">
                  PIXL-{targetBoardId}
                </span>
              )}
            </div>
          </button>
        )}

        {/* Connect USB Button (Desktop Chrome/Edge only, hidden if !('serial' in navigator)) */}
        {isUsbSupported && (
          isUsbConnected ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 shadow">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-slate-200">
                  <span className="text-cyan-400">{usbState.deviceName}</span>
                </span>
              </div>
              <button
                onClick={onDisconnectUsb}
                className="ml-2 px-2 py-1 bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 text-xs rounded transition"
              >
                {strings.disconnectUsb}
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectUsb}
              disabled={isUsbConnecting}
              className="px-3.5 py-3 rounded-xl font-semibold text-sm bg-cyan-700 hover:bg-cyan-600 text-white flex items-center gap-2 transition shadow-lg shadow-cyan-950/40 active:scale-95 touch-manipulation disabled:opacity-50"
              title="Connect over USB Web Serial (115200 baud)"
            >
              <Usb className={`w-5 h-5 ${isUsbConnecting ? 'animate-pulse' : ''}`} />
              <span>{isUsbConnecting ? 'Connecting USB...' : strings.connectUsb}</span>
            </button>
          )
        )}

        {/* Status indicator message */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
          {activeStatusMsg ? (
            <span className="text-slate-300 font-mono font-medium truncate max-w-xs">{activeStatusMsg}</span>
          ) : (isBleConnected || isUsbConnected) ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready to flash</span>
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
