import React from 'react';
import { X, AlertCircle, Compass, Laptop, Tablet } from 'lucide-react';
import { AppStrings } from '../i18n/strings';

interface BluetoothNotSupportedModalProps {
  onClose: () => void;
  strings: AppStrings;
}

export const BluetoothNotSupportedModal: React.FC<BluetoothNotSupportedModalProps> = ({
  onClose,
  strings
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99999] app-modal-overlay flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{strings.bluetoothNotSupportedTitle}</h2>
              <p className="text-xs text-slate-400">Supported Browsers & Platforms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {strings.bluetoothNotSupportedDesc1}
        </p>

        {/* Browser recommendations */}
        <div className="space-y-3">
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3">
            <Tablet className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <strong className="text-white block mb-0.5">iPad & iPhone (iOS):</strong>
              Safari on iOS does not support Web Bluetooth. Please open this web page in the free{' '}
              <span className="text-sky-400 font-bold">Bluefy</span> browser app from the App Store.
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3">
            <Laptop className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <strong className="text-white block mb-0.5">Mac, Windows, Linux, Android:</strong>
              Use Google Chrome, Microsoft Edge, or Opera with Bluetooth turned on in system settings.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
          >
            {strings.close}
          </button>
        </div>
      </div>
    </div>
  );
};
