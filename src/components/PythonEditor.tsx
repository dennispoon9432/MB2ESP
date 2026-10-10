import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Lock, Unlock, AlertTriangle, RotateCcw, Copy, Check } from 'lucide-react';
import { AppStrings } from '../i18n/strings';

interface PythonEditorProps {
  pythonCode: string;
  isPythonEdited: boolean;
  onChangeCode: (code: string) => void;
  onEnablePythonEdit: () => void;
  onRevertToBlocks: () => void;
  strings: AppStrings;
}

export const PythonEditor: React.FC<PythonEditorProps> = ({
  pythonCode,
  isPythonEdited,
  onChangeCode,
  onEnablePythonEdit,
  onRevertToBlocks,
  strings
}) => {
  const [copied, setCopied] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmEdit = () => {
    setShowWarningModal(false);
    onEnablePythonEdit();
  };

  return (
    <div className="relative flex-1 h-full w-full bg-[#1e1e1e] flex flex-col">
      {/* Top Banner */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isPythonEdited ? (
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Unlock className="w-3.5 h-3.5" />
              <span>Python Mode (Editing Unlocked)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Lock className="w-3.5 h-3.5" />
              <span>{strings.pythonReadOnlyBadge}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 transition text-xs font-medium"
            title="Copy Python Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {!isPythonEdited ? (
            <button
              onClick={() => setShowWarningModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold text-xs shadow transition active:scale-95"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{strings.pythonEditButton}</span>
            </button>
          ) : (
            <button
              onClick={onRevertToBlocks}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition text-xs"
              title="Discard custom Python edits and regenerate from Blocks"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset from Blocks</span>
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full h-full">
        <Editor
          height="100%"
          language="python"
          theme="vs-dark"
          value={pythonCode}
          options={{
            readOnly: !isPythonEdited,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            lineNumbers: 'on',
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3
          }}
          onChange={(val) => {
            if (isPythonEdited && val !== undefined) {
              onChangeCode(val);
            }
          }}
        />
      </div>

      {/* Warning Modal when unlocking Python editing */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-amber-500/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white">
                {strings.pythonWarningTitle}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {strings.pythonWarningDesc}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                {strings.pythonCancel}
              </button>
              <button
                onClick={handleConfirmEdit}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-lg shadow-amber-950"
              >
                {strings.pythonEditAnyway}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
