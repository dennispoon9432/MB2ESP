import React, { useState } from 'react';
import { Plus, Upload, Trash2, Copy, Edit2, Download, Calendar, Cpu, Sparkles } from 'lucide-react';
import { Project } from '../types/project';
import { AppStrings } from '../i18n/strings';

interface HomeScreenProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  onExportProject: (project: Project) => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  strings: AppStrings;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  projects,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onDuplicateProject,
  onRenameProject,
  onExportProject,
  onImportFile,
  strings
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startRename = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(p.id);
    setEditingName(p.name);
  };

  const saveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editingName.trim()) {
      onRenameProject(id, editingName.trim());
    }
    setEditingId(null);
  };

  const renderThumbnail = (pattern?: string) => {
    const raw = pattern || '01010:11111:11111:01110:00100';
    const rows = raw.split(':');
    return (
      <div className="w-24 h-24 bg-slate-950 rounded-xl p-2.5 grid grid-cols-5 gap-1.5 shadow-inner border border-slate-800">
        {rows.flatMap((r, rowIdx) =>
          r.split('').map((c, colIdx) => {
            const isLit = c === '1';
            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`rounded-sm transition-all ${
                  isLit ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-850'
                }`}
                style={{ backgroundColor: isLit ? '#FF3333' : '#1A2530' }}
              />
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Home Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-sky-500 flex items-center justify-center font-black text-slate-950 text-base shadow-lg">
            MB
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-white leading-none">
              MB2ESP Code Studio
            </h1>
            <p className="text-xs text-emerald-400 font-semibold tracking-wide">
              Visual Block & MicroPython Editor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Hidden file input for project import */}
          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition active:scale-95 touch-manipulation">
            <Upload className="w-4 h-4 text-sky-400" />
            <span>{strings.importProject}</span>
            <input
              type="file"
              accept=".pixl,.json"
              onChange={onImportFile}
              className="hidden"
            />
          </label>
        </div>
      </header>

      {/* Hero Banner with Quick Actions */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Create. Simulate. Flash over Bluetooth.
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
              Build projects for your MB2ESP microcontroller board with MakeCode-style drag & drop blocks or MicroPython. Connects directly over Web Bluetooth.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNewProject}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-emerald-950/50 transition-all active:scale-95 touch-manipulation"
            >
              <Plus className="w-5 h-5" />
              <span>{strings.newProject}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Projects Gallery */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider text-xs">
              {strings.myProjects} ({projects.length})
            </h3>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {/* New Project Card */}
          <div
            onClick={onNewProject}
            className="group aspect-[4/3] rounded-3xl border-2 border-dashed border-slate-800 hover:border-emerald-500/80 bg-slate-900/40 hover:bg-slate-900/80 p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 touch-manipulation"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-md">
              <Plus className="w-7 h-7" />
            </div>
            <span className="font-bold text-sm text-slate-300 group-hover:text-white mt-3">
              {strings.newProject}
            </span>
          </div>

          {/* Saved Projects Cards */}
          {projects.map(proj => {
            const isEditing = editingId === proj.id;
            const updatedDate = new Date(proj.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            });

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className="group relative rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:shadow-2xl transition-all duration-200 flex flex-col overflow-hidden cursor-pointer active:scale-[0.98] touch-manipulation"
              >
                {/* Card Thumbnail Area */}
                <div className="bg-slate-950/80 p-5 flex items-center justify-center border-b border-slate-800/80 relative">
                  {renderThumbnail(proj.thumbnailLed)}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1">
                    {proj.isPythonEdited && (
                      <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800/80 px-2 py-0.5 rounded-full font-mono font-semibold">
                        Python
                      </span>
                    )}
                    {proj.extensions?.length > 0 && (
                      <span className="text-[10px] bg-purple-950 text-purple-400 border border-purple-800/80 px-2 py-0.5 rounded-full font-semibold">
                        +{proj.extensions.length} ext
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content & Actions */}
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    {isEditing ? (
                      <form onSubmit={e => saveRename(proj.id, e)} onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onBlur={e => saveRename(proj.id, e)}
                          autoFocus
                          className="w-full bg-slate-950 border border-emerald-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                        />
                      </form>
                    ) : (
                      <h4 className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition truncate">
                        {proj.name}
                      </h4>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{strings.lastEdited} {updatedDate}</span>
                    </div>
                  </div>

                  {/* Action buttons row */}
                  <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-800/60">
                    <button
                      onClick={e => startRename(proj, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title={strings.renameProject}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDuplicateProject(proj.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title={strings.duplicateProject}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onExportProject(proj);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title={strings.exportProject}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setConfirmDeleteId(proj.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/50 transition"
                      title={strings.deleteProject}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99999] app-modal-overlay flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="font-bold text-base text-white">{strings.deleteProject}</h3>
            <p className="text-xs text-slate-400">{strings.confirmDelete}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                {strings.cancel}
              </button>
              <button
                onClick={() => {
                  if (confirmDeleteId) {
                    onDeleteProject(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow"
              >
                {strings.deleteProject}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
