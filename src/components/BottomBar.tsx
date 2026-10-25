import React from 'react';
import { Bluetooth, Usb, HelpCircle, Terminal, Loader2 } from 'lucide-react';
import { BluetoothState } from '../services/bluetooth';
import { USBSerialState } from '../services/usbSerial';
import { AppStrings } from '../i18n/strings';
import { cleanBoardId, isValidBoardId } from '../utils/boardId';

interface BottomBarProps {
  bluetoothState: BluetoothState;
  usbState: USBSerialState;
  boardId: string;
  onBoardIdChange: (newId: string) => void;
  onUploadBluetooth: () => void;
  onDisconnectBluetooth: () => void;
  onUploadUsb: () => void;
  onDisconnectUsb: () => void;
  isUsbSupported: boolean;
  onOpenPairingHelp: () => void;
  onToggleSerial: () => void;
  isSerialOpen: boolean;
  strings: AppStrings;
  statusNotice?: string | null;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  bluetoothState,
  usbState,
  boardId,
  onBoardIdChange,
  onUploadBluetooth,
  onDisconnectBluetooth,
  onUploadUsb,
  onDisconnectUsb,
  isUsbSupported,
  onOpenPairingHelp,
  onToggleSerial,
  isSerialOpen,
  strings,
  statusNotice
}) => {
  const isBleConnected = bluetoothState.status === 'connected';
  const isUsbConnected = usbState.status === 'connected';
  const isFlashing = bluetoothState.status === 'flashing' || usbState.status === 'flashing';
  const isBleConnecting = bluetoothState.status === 'connecting';
  const isUsbConnecting = usbState.status === 'connecting';

  const isValid = isValidBoardId(boardId);
  const flashProgress = usbState.status === 'flashing' ? usbState.progress : bluetoothState.progress;

  // Compute status line text
  let statusText = '';
  if (isFlashing) {
    statusText = usbState.status === 'flashing' ? usbState.statusMessage : bluetoothState.statusMessage;
  } else if (statusNotice) {
    statusText = statusNotice;
  } else if (usbState.statusMessage && usbState.statusMessage.startsWith('Uploaded!')) {
    statusText = usbState.statusMessage;
  } else if (bluetoothState.statusMessage && bluetoothState.statusMessage.startsWith('Uploaded!')) {
    statusText = bluetoothState.statusMessage;
  } else if (isBleConnected && isUsbConnected) {
    const bleName = bluetoothState.deviceName || boardId;
    statusText = `Bluetooth: connected to ${bleName} | USB: connected`;
  } else if (isBleConnected) {
    const bleName = bluetoothState.deviceName || boardId;
    statusText = `Bluetooth: connected to ${bleName}`;
  } else if (isUsbConnected) {
    statusText = 'USB: connected';
  } else if (usbState.statusMessage === 'USB: not connected') {
    statusText = 'USB: not connected';
  } else {
    statusText = 'Not connected';
  }

  return (
    <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20">
      {/* Left: Board ID input, Upload via Bluetooth, Upload via USB, Status */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 1. Board ID Field */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <label htmlFor="board-id-input" className="text-xs font-semibold text-slate-300 whitespace-nowrap">
              {strings.boardIdLabel}:
            </label>
            <input
              id="board-id-input"
              type="text"
              value={boardId}
              maxLength={6}
              onChange={(e) => {
                const cleaned = cleanBoardId(e.target.value);
                onBoardIdChange(cleaned);
              }}
              placeholder="e.g. A96E08"
              title="The 6 letters/numbers on your board's screen in Bluetooth mode"
              className={`w-28 px-2 py-1.5 bg-slate-900 border rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-center focus:outline-none transition-all ${
                isValid
                  ? 'border-indigo-500/70 text-indigo-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
                  : boardId.length > 0
                  ? 'border-rose-500/80 text-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                  : 'border-slate-700 text-slate-300 focus:border-indigo-500'
              }`}
            />
          </div>
          {!isValid && (
            <span className="text-[10px] text-rose-400 font-medium mt-0.5 whitespace-nowrap">
              {strings.boardIdHint}
            </span>
          )}
        </div>

        {/* 2. Upload via Bluetooth Button + Disconnect */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onUploadBluetooth}
            disabled={!isValid || isFlashing || isBleConnecting}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 touch-manipulation ${
              !isValid
                ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : isFlashing && bluetoothState.status === 'flashing'
                ? 'bg-amber-600 text-white cursor-wait animate-pulse'
                : isBleConnecting
                ? 'bg-indigo-700 text-indigo-200 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50'
            }`}
            title={
              !isValid
                ? 'Enter valid 6-character hex Board ID to upload via Bluetooth'
                : `Upload program to board ${boardId} via Bluetooth`
            }
          >
            {isBleConnecting || (isFlashing && bluetoothState.status === 'flashing') ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bluetooth className="w-4 h-4" />
            )}
            <span>{strings.uploadBluetooth}</span>
          </button>
          {isBleConnected && (
            <button
              onClick={onDisconnectBluetooth}
              className="text-xs text-slate-400 hover:text-rose-400 underline transition px-1"
              title="Disconnect Bluetooth"
            >
              {strings.disconnect}
            </button>
          )}
        </div>

        {/* 3. Upload via USB Button + Disconnect */}
        {isUsbSupported && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onUploadUsb}
              disabled={isFlashing || isUsbConnecting}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 touch-manipulation ${
                isFlashing && usbState.status === 'flashing'
                  ? 'bg-amber-600 text-white cursor-wait animate-pulse'
                  : isUsbConnecting
                  ? 'bg-cyan-800 text-cyan-200 cursor-wait'
                  : 'bg-cyan-700 hover:bg-cyan-600 text-white shadow-cyan-950/50'
              }`}
              title="Upload program via USB Web Serial (does not require Board ID)"
            >
              {isUsbConnecting || (isFlashing && usbState.status === 'flashing') ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Usb className="w-4 h-4" />
              )}
              <span>{strings.uploadUsb}</span>
            </button>
            {isUsbConnected && (
              <button
                onClick={onDisconnectUsb}
                className="text-xs text-slate-400 hover:text-rose-400 underline transition px-1"
                title="Disconnect USB"
              >
                {strings.disconnect}
              </button>
            )}
          </div>
        )}

        {/* 4. Status Indicator */}
        <div className="flex flex-col justify-center min-w-[150px] max-w-md">
          {isFlashing && (
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-700 mb-1">
              <div
                className="bg-amber-400 h-full transition-all duration-200"
                style={{ width: `${flashProgress}%` }}
              />
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            {isBleConnected || isUsbConnected ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
            )}
            <span
              className={`truncate ${
                statusText.startsWith('Uploaded!')
                  ? 'text-emerald-400 font-semibold'
                  : statusText.includes('not found') || statusText.includes('failed') || statusText.includes('Error')
                  ? 'text-amber-300 font-medium'
                  : isBleConnected || isUsbConnected
                  ? 'text-slate-200 font-mono'
                  : 'text-slate-400'
              }`}
              title={statusText}
            >
              {statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Pairing Guide */}
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
