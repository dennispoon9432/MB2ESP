import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, Send, X, ArrowDown } from 'lucide-react';
import { AppStrings } from '../i18n/strings';
import { bluetoothService } from '../services/bluetooth';
import { usbSerialService } from '../services/usbSerial';

interface SerialConsoleProps {
  logs: string[];
  onClear: () => void;
  onClose: () => void;
  strings: AppStrings;
  isBleConnected: boolean;
  isUsbConnected: boolean;
}

export const SerialConsole: React.FC<SerialConsoleProps> = ({
  logs,
  onClear,
  onClose,
  strings,
  isBleConnected,
  isUsbConnected
}) => {
  const [inputText, setInputText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const isConnected = isBleConnected || isUsbConnected;

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const toSend = inputText + '\r\n';
    if (isUsbConnected) {
      await usbSerialService.sendText(toSend);
    } else if (isBleConnected) {
      await bluetoothService.sendSerial(toSend);
    }
    setInputText('');
  };

  return (
    <div className="h-56 bg-slate-950 border-t border-slate-800 flex flex-col font-mono text-xs select-none">
      {/* Console Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-300">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs tracking-wide">
            {strings.serialConsole}
          </span>
          <span className="text-[10px] text-slate-500">
            {isUsbConnected
              ? '● USB REPL (115200 baud)'
              : isBleConnected
              ? '● BLE UART (115200 baud)'
              : '○ Simulator / Offline'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded text-[10px] flex items-center gap-1 ${
              autoScroll ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Auto-scroll"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Scroll</span>
          </button>

          <button
            onClick={onClear}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
            title={strings.serialClear}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
            title={strings.close}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={logContainerRef}
        className="flex-1 p-3 overflow-y-auto space-y-1 font-mono text-emerald-400/90 bg-slate-950 select-text"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic select-none">
            {strings.serialPlaceholder}
          </div>
        ) : (
          logs.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap break-all leading-relaxed font-mono">
              {line}
            </div>
          ))
        )}
      </div>

      {/* Input box for sending to UART / REPL */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border-t border-slate-800">
        <span className="text-slate-500 font-bold">&gt;</span>
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={isConnected ? "Send command to MB2ESP..." : "Connect USB or BLE to send serial commands"}
          disabled={!isConnected}
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs font-mono disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!isConnected || !inputText.trim()}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-medium text-xs flex items-center gap-1 transition"
        >
          <Send className="w-3 h-3" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
