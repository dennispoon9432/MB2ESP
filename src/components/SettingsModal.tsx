import React, { useState } from 'react';
import { X, Sliders, Globe, Cpu, Info } from 'lucide-react';
import { ProjectSettings } from '../types/project';
import { AppStrings, Language } from '../i18n/strings';

interface SettingsModalProps {
  settings: ProjectSettings;
  onSaveSettings: (settings: ProjectSettings) => void;
  onClose: () => void;
  strings: AppStrings;
  onOpenFirmwareInstaller?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
  strings,
  onOpenFirmwareInstaller
}) => {
  const [chunkSize, setChunkSize] = useState(settings.bleChunkSize || 180);
  const [lang, setLang] = useState<Language>(settings.language || 'en');

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      bleChunkSize: Math.max(20, Math.min(240, chunkSize)),
      language: lang
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99999] app-modal-overlay flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{strings.settings}</h2>
              <p className="text-xs text-slate-400">Board & connection preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-4">
          {/* BLE Chunk Size */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                {strings.chunkSizeSetting}
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {chunkSize} bytes
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {strings.chunkSizeDesc}
            </p>
            <input
              type="range"
              min="20"
              max="240"
              step="10"
              value={chunkSize}
              onChange={e => setChunkSize(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Language Selector */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <label className="text-xs font-bold text-slate-200">
                {strings.languageSetting}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                  lang === 'en'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('zh')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                  lang === 'zh'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                中文 (繁體/簡體)
              </button>
            </div>
          </div>

          {/* Advanced / Tools */}
          {onOpenFirmwareInstaller && (
            <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">Board Firmware Tool</span>
                <span className="text-[11px] text-slate-500">Flash blank ESP32-S3 board with PIXL MicroPython over USB</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFirmwareInstaller();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 border border-slate-700/80 text-xs font-semibold text-slate-300 transition"
              >
                Install firmware
              </button>
            </div>
          )}

          {/* About MB2ESP Hardware */}
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>MB2ESP Board Architecture</span>
            </div>
            <p>
              Dual-core ESP32 with built-in 128x64 I2C OLED (SSD1306), BLE Nordic UART Service, and MicroPython <code className="text-emerald-400">pixl.py</code> runtime.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            {strings.cancel}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950"
          >
            {strings.save}
          </button>
        </div>
      </div>
    </div>
  );
};
