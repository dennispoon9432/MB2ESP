import React, { useState } from 'react';
import { X, Search, Sparkles, Cog, Github, Check, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { ProjectExtension } from '../types/project';
import { BUILTIN_EXTENSIONS } from '../types/extension';
import { fetchExtensionFromGitHub } from '../services/extensions';
import { AppStrings } from '../i18n/strings';

interface ExtensionsModalProps {
  installedExtensions: ProjectExtension[];
  onToggleExtension: (ext: ProjectExtension) => void;
  onClose: () => void;
  strings: AppStrings;
}

export const ExtensionsModal: React.FC<ExtensionsModalProps> = ({
  installedExtensions,
  onToggleExtension,
  onClose,
  strings
}) => {
  const [search, setSearch] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isInstalled = (id: string) => {
    return installedExtensions.some(e => e.id === id);
  };

  const filteredBuiltins = BUILTIN_EXTENSIONS.filter(ext =>
    ext.name.toLowerCase().includes(search.toLowerCase()) ||
    ext.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleImportGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    setLoadingGithub(true);
    setErrorMsg(null);

    try {
      const ext = await fetchExtensionFromGitHub(githubUrl);
      onToggleExtension(ext);
      setGithubUrl('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import extension from GitHub');
    } finally {
      setLoadingGithub(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{strings.extensions}</h2>
              <p className="text-xs text-slate-400">Add peripheral drivers & hardware blocks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & GitHub Import */}
        <div className="py-4 space-y-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={strings.searchExtensions}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Import from GitHub */}
          <form onSubmit={handleImportGithub} className="flex gap-2">
            <div className="relative flex-1">
              <Github className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/user/pixl-extension"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              type="submit"
              disabled={loadingGithub || !githubUrl.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow"
            >
              {loadingGithub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{strings.importFromGithub}</span>
            </button>
          </form>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Extensions List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Available Extensions
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredBuiltins.map(ext => {
              const installed = isInstalled(ext.id);
              return (
                <div
                  key={ext.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                    installed
                      ? 'bg-slate-950 border-emerald-600/60 shadow-emerald-950/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: ext.color || '#FF7F00' }}
                      >
                        {ext.icon === 'Sparkles' ? <Sparkles className="w-4 h-4" /> : <Cog className="w-4 h-4" />}
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                        {strings.builtIn}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-200">{ext.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{ext.description}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      onClick={() => onToggleExtension(ext)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                        installed
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-red-950 hover:text-red-400 hover:border-red-800'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {installed ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{strings.installed}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>{strings.addExtension}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Installed custom extensions */}
          {installedExtensions.filter(e => !e.isBuiltIn).length > 0 && (
            <div className="pt-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Custom GitHub Extensions
              </div>
              <div className="space-y-2">
                {installedExtensions.filter(e => !e.isBuiltIn).map(ext => (
                  <div
                    key={ext.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-200">{ext.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{ext.repoUrl}</div>
                    </div>
                    <button
                      onClick={() => onToggleExtension(ext)}
                      className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-950/60 rounded border border-red-900/50 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-slate-800 flex justify-end">
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
