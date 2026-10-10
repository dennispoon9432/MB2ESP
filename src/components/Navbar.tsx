import React, { useState, useEffect } from 'react';
import { Home, Code, Blocks, Puzzle, Settings, Download, HelpCircle, Check } from 'lucide-react';
import { AppStrings } from '../i18n/strings';

interface NavbarProps {
  projectName: string;
  onRename: (newName: string) => void;
  onGoHome: () => void;
  isPythonMode: boolean;
  onToggleMode: (targetIsPython: boolean) => void;
  onOpenExtensions: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onExport: () => void;
  strings: AppStrings;
}

export const Navbar: React.FC<NavbarProps> = ({
  projectName,
  onRename,
  onGoHome,
  isPythonMode,
  onToggleMode,
  onOpenExtensions,
  onOpenSettings,
  onOpenHelp,
  onExport,
  strings
}) => {
  const [name, setName] = useState(projectName);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    setName(projectName);
  }, [projectName]);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (name.trim()) {
      onRename(name.trim());
    } else {
      setName(projectName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    }
  };

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between select-none z-30">
      {/* Left: Brand & Home Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition active:scale-95 touch-manipulation group"
          title={strings.home}
        >
          <Home className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          <span className="text-xs font-bold hidden sm:inline">{strings.home}</span>
        </button>

        {/* Logo / Brand */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-500 to-sky-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-md">
            MB
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-white leading-none">
              MB2ESP
            </span>
            <span className="text-[9px] font-semibold text-emerald-400 tracking-wider">
              STUDIO
            </span>
          </div>
        </div>
      </div>

      {/* Center: Blocks | Python Toggle (Iconic MakeCode Style) */}
      <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
        <button
          onClick={() => onToggleMode(false)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all touch-manipulation ${
            !isPythonMode
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Blocks className="w-3.5 h-3.5" />
          <span>{strings.blocks}</span>
        </button>

        <button
          onClick={() => onToggleMode(true)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all touch-manipulation ${
            isPythonMode
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>{strings.python}</span>
        </button>
      </div>

      {/* Right: Project Name, Extensions, Settings, Export */}
      <div className="flex items-center gap-2">
        {/* Project Name editable */}
        <div className="relative hidden md:block">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onFocus={() => setIsEditingName(true)}
            onBlur={handleNameBlur}
            onKeyDown={handleKeyDown}
            className="w-40 lg:w-48 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 focus:outline-none transition"
            placeholder={strings.untitledProject}
          />
          {isEditingName && (
            <button
              onClick={handleNameBlur}
              className="absolute right-1 top-1 text-emerald-400 p-0.5"
            >
              <Check className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Extensions */}
        <button
          onClick={onOpenExtensions}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-xs font-medium"
          title={strings.extensions}
        >
          <Puzzle className="w-4 h-4 text-purple-400" />
          <span className="hidden lg:inline">{strings.extensions}</span>
        </button>

        {/* Export / Download .pixl */}
        <button
          onClick={onExport}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
          title={strings.exportProject}
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
          title={strings.settings}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Help */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
          title={strings.help}
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
        </button>
      </div>
    </header>
  );
};
