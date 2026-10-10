/**
 * MB2ESP Code Studio - Main Application Component
 * Visual block-based and Python editor for the MB2ESP microcontroller board.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Blockly from 'blockly';
import confetti from 'canvas-confetti';

import { Project, ProjectExtension, ProjectSettings } from './types/project';
import {
  getAllProjects,
  getProjectById,
  saveProject,
  createNewProject,
  deleteProject,
  duplicateProject,
  getActiveProjectId,
  setActiveProjectId,
  exportProjectToFile,
  importProjectFromJson
} from './services/storage';
import { bluetoothService, BluetoothState } from './services/bluetooth';
import { usbSerialService, USBSerialState } from './services/usbSerial';
import { MB2ESPSimulator } from './simulator/MB2ESPSimulator';
import { executeWorkspace } from './simulator/simulatorInterpreter';
import { getStrings } from './i18n/strings';

// Components
import { Navbar } from './components/Navbar';
import { SimulatorPanel } from './components/SimulatorPanel';
import { BlocklyWorkspace } from './components/BlocklyWorkspace';
import { PythonEditor } from './components/PythonEditor';
import { BottomBar } from './components/BottomBar';
import { SerialConsole } from './components/SerialConsole';
import { HomeScreen } from './components/HomeScreen';
import { ExtensionsModal } from './components/ExtensionsModal';
import { SettingsModal } from './components/SettingsModal';
import { PairingHelpModal } from './components/PairingHelpModal';
import { BluetoothNotSupportedModal } from './components/BluetoothNotSupportedModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'editor'>('editor');
  const [projects, setProjects] = useState<Project[]>(() => getAllProjects());
  const [activeProject, setActiveProject] = useState<Project>(() => {
    const activeId = getActiveProjectId();
    const found = activeId ? getProjectById(activeId) : null;
    return found || projects[0] || createNewProject();
  });

  // Simulator, Bluetooth & USB State
  const simulator = useMemo(() => new MB2ESPSimulator(), []);
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>(() => bluetoothService.getState());
  const [usbState, setUsbState] = useState<USBSerialState>(() => usbSerialService.getState());
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [isSerialOpen, setIsSerialOpen] = useState(false);

  // Modals
  const [showExtensionsModal, setShowExtensionsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [showBtUnsupportedModal, setShowBtUnsupportedModal] = useState(false);

  // Active Blockly Workspace ref
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  const handleOpenExtensions = () => {
    try {
      (workspaceRef.current?.getToolbox() as any)?.clearSelection?.();
    } catch (e) {}
    setShowExtensionsModal(true);
  };

  // Strings / i18n
  const strings = useMemo(() => getStrings(activeProject.settings?.language || 'en'), [activeProject.settings?.language]);

  // Sync Bluetooth, USB & Simulator listeners
  useEffect(() => {
    const unbindState = bluetoothService.addStateListener(state => {
      setBluetoothState(state);
    });

    const unbindUsbState = usbSerialService.addStateListener(state => {
      setUsbState(state);
    });

    const unbindSerial = bluetoothService.addSerialListener(data => {
      setSerialLogs(prev => [...prev.slice(-300), `[MB2ESP BLE] ${data}`]);
    });

    const unbindUsbSerial = usbSerialService.addSerialListener(data => {
      setSerialLogs(prev => [...prev.slice(-300), data]);
    });

    const unbindSimLog = simulator.addLogListener(data => {
      setSerialLogs(prev => [...prev.slice(-300), data]);
    });

    return () => {
      unbindState();
      unbindUsbState();
      unbindSerial();
      unbindUsbSerial();
      unbindSimLog();
    };
  }, [simulator]);

  // Refresh projects from storage
  const reloadProjects = () => {
    const list = getAllProjects();
    setProjects(list);
  };

  // Switch to project
  const handleSelectProject = (id: string) => {
    const p = getProjectById(id);
    if (p) {
      setActiveProject(p);
      setActiveProjectId(p.id);
      setCurrentView('editor');
    }
  };

  // Create new project
  const handleNewProject = () => {
    const newProj = createNewProject();
    reloadProjects();
    setActiveProject(newProj);
    setCurrentView('editor');
  };

  // Delete project
  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    reloadProjects();
    const active = getActiveProjectId();
    const next = getProjectById(active) || getAllProjects()[0];
    if (next) {
      setActiveProject(next);
    }
  };

  // Duplicate project
  const handleDuplicateProject = (id: string) => {
    duplicateProject(id);
    reloadProjects();
  };

  // Rename project
  const handleRenameProject = (id: string, newName: string) => {
    const p = getProjectById(id);
    if (p) {
      const updated = { ...p, name: newName };
      saveProject(updated);
      reloadProjects();
      if (activeProject.id === id) {
        setActiveProject(updated);
      }
    }
  };

  // Export project to .pixl file
  const handleExportProject = (proj: Project) => {
    exportProjectToFile(proj);
  };

  // Import project from .pixl file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = importProjectFromJson(content);
        reloadProjects();
        setActiveProject(imported);
        setCurrentView('editor');
      } catch (err: any) {
        alert('Failed to import project: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Connect simulator restart listener to re-run the workspace on RST or reset button
  useEffect(() => {
    simulator.setRestartListener(() => {
      if (workspaceRef.current && !activeProject.isPythonMode) {
        executeWorkspace(workspaceRef.current, simulator).catch(err => {
          console.warn('Restart simulation error:', err);
        });
      }
    });
  }, [simulator, activeProject.isPythonMode]);

  // Handle workspace change (auto-save and rerun simulator)
  const handleWorkspaceChange = (xmlText: string, pythonCode: string) => {
    const updated: Project = {
      ...activeProject,
      blocklyXml: xmlText,
      // If user has not detached into custom python mode, sync generated python
      pythonCode: activeProject.isPythonEdited ? activeProject.pythonCode : pythonCode
    };

    saveProject(updated);
    setActiveProject(updated);

    // Auto-run simulation when workspace changes
    if (workspaceRef.current && !activeProject.isPythonMode) {
      executeWorkspace(workspaceRef.current, simulator).catch(err => {
        console.warn('Simulation execution err:', err);
      });
    }
  };

  // Switch between Blocks and Python mode
  const handleToggleMode = (targetIsPython: boolean) => {
    const updated = {
      ...activeProject,
      isPythonMode: targetIsPython
    };
    saveProject(updated);
    setActiveProject(updated);
  };

  // Unlock Python code for direct editing
  const handleEnablePythonEdit = () => {
    const updated = {
      ...activeProject,
      isPythonEdited: true,
      isPythonMode: true
    };
    saveProject(updated);
    setActiveProject(updated);
  };

  // Revert custom Python edits and restore generated code from Blocks
  const handleRevertToBlocks = () => {
    const updated = {
      ...activeProject,
      isPythonEdited: false
    };
    saveProject(updated);
    setActiveProject(updated);
    if (workspaceRef.current) {
      executeWorkspace(workspaceRef.current, simulator);
    }
  };

  // Update Python code directly
  const handlePythonCodeChange = (newCode: string) => {
    const updated = {
      ...activeProject,
      pythonCode: newCode
    };
    saveProject(updated);
    setActiveProject(updated);
  };

  // Save Settings
  const handleSaveSettings = (settings: ProjectSettings) => {
    const updated = {
      ...activeProject,
      settings
    };
    saveProject(updated);
    setActiveProject(updated);
  };

  // Toggle Extension (Install / Uninstall)
  const handleToggleExtension = (ext: ProjectExtension) => {
    const exists = activeProject.extensions.some(e => e.id === ext.id);
    let newExtensions: ProjectExtension[];
    if (exists) {
      newExtensions = activeProject.extensions.filter(e => e.id !== ext.id);
    } else {
      newExtensions = [...activeProject.extensions, ext];
    }

    const updated = {
      ...activeProject,
      extensions: newExtensions
    };
    saveProject(updated);
    setActiveProject(updated);
  };

  // Connect Web Bluetooth
  const handleConnect = async () => {
    if (!bluetoothService.isSupported()) {
      setShowBtUnsupportedModal(true);
      return;
    }

    try {
      await bluetoothService.connect();
    } catch (err: any) {
      if (err.message === 'WEB_BLUETOOTH_UNSUPPORTED') {
        setShowBtUnsupportedModal(true);
      }
    }
  };

  // Disconnect Web Bluetooth
  const handleDisconnect = async () => {
    await bluetoothService.disconnect();
  };

  // Connect USB Web Serial
  const handleConnectUsb = async () => {
    try {
      await usbSerialService.connect();
    } catch (err: any) {
      console.warn('USB Serial connect error:', err);
    }
  };

  // Disconnect USB Web Serial
  const handleDisconnectUsb = async () => {
    await usbSerialService.disconnect();
  };

  // Flash code to MB2ESP board (USB or Bluetooth)
  const handleFlash = async () => {
    // Prepend all installed extensions' Python driver code into main.py
    // Never upload boot.py or pixl.py; flash always writes main.py only
    const extPys = activeProject.extensions.map(e => `# Extension: ${e.name}\n${e.extPy}`).join('\n\n');
    const fullPythonCode = extPys ? `${extPys}\n\n${activeProject.pythonCode}` : activeProject.pythonCode;

    // 1. If USB Serial is connected, flash via USB raw REPL
    if (usbSerialService.isConnected()) {
      try {
        setSerialLogs(prev => [
          ...prev,
          `\n[MB2ESP USB] Starting flash to main.py (${fullPythonCode.length} bytes)...`
        ]);
        await usbSerialService.flashCode(fullPythonCode);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.85 }
        });
        setSerialLogs(prev => [
          ...prev,
          `[MB2ESP USB] Code flashed successfully! Soft reset completed.\n`
        ]);
        return;
      } catch (err: any) {
        setSerialLogs(prev => [
          ...prev,
          `[MB2ESP USB ERROR] ${err.message || 'USB upload failed'}\n`
        ]);
        return;
      }
    }

    // 2. If Bluetooth BLE is connected, flash via BLE
    if (bluetoothState.status === 'connected') {
      try {
        setSerialLogs(prev => [
          ...prev,
          `\n[MB2ESP BLE] Starting flash to main.py (${fullPythonCode.length} bytes)...`
        ]);
        await bluetoothService.flashCode(fullPythonCode, activeProject.settings?.bleChunkSize || 180);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.85 }
        });
        setSerialLogs(prev => [
          ...prev,
          `[MB2ESP BLE] Successfully flashed code to main.py! Board restarted.\n`
        ]);
        return;
      } catch (err: any) {
        setSerialLogs(prev => [
          ...prev,
          `[MB2ESP BLE ERROR] ${err.message || 'BLE upload failed'}\n`
        ]);
        return;
      }
    }

    // 3. If neither is connected, prompt user based on browser capabilities
    if (usbSerialService.isSupported()) {
      // Connect USB first if supported
      try {
        const connected = await usbSerialService.connect();
        if (connected) {
          await handleFlash();
        }
      } catch (e) {
        // User may choose BLE instead
      }
    } else if (bluetoothService.isSupported()) {
      await handleConnect();
    } else {
      setShowBtUnsupportedModal(true);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {currentView === 'home' ? (
        <HomeScreen
          projects={projects}
          onSelectProject={handleSelectProject}
          onNewProject={handleNewProject}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onRenameProject={handleRenameProject}
          onExportProject={handleExportProject}
          onImportFile={handleImportFile}
          strings={strings}
        />
      ) : (
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* Top Bar */}
          <Navbar
            projectName={activeProject.name}
            onRename={name => handleRenameProject(activeProject.id, name)}
            onGoHome={() => {
              reloadProjects();
              setCurrentView('home');
            }}
            isPythonMode={activeProject.isPythonMode}
            onToggleMode={handleToggleMode}
            onOpenExtensions={handleOpenExtensions}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenHelp={() => setShowPairingModal(true)}
            onExport={() => handleExportProject(activeProject)}
            strings={strings}
          />

          {/* Main Work Area: Left Simulator + Right Workspace/Python Editor */}
          <div className="flex-1 flex flex-row overflow-hidden relative">
            {/* Left Simulator Panel */}
            <SimulatorPanel
              simulator={simulator}
              strings={strings}
              onToggleSerial={() => setIsSerialOpen(!isSerialOpen)}
              isSerialOpen={isSerialOpen}
            />

            {/* Right Editor Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {activeProject.isPythonMode ? (
                <PythonEditor
                  pythonCode={activeProject.pythonCode}
                  isPythonEdited={activeProject.isPythonEdited}
                  onChangeCode={handlePythonCodeChange}
                  onEnablePythonEdit={handleEnablePythonEdit}
                  onRevertToBlocks={handleRevertToBlocks}
                  strings={strings}
                />
              ) : (
                <BlocklyWorkspace
                  project={activeProject}
                  onWorkspaceChange={handleWorkspaceChange}
                  onOpenExtensions={handleOpenExtensions}
                  strings={strings}
                  workspaceRef={workspaceRef}
                />
              )}

              {/* Collapsible Serial Console */}
              {isSerialOpen && (
                <SerialConsole
                  logs={serialLogs}
                  onClear={() => setSerialLogs([])}
                  onClose={() => setIsSerialOpen(false)}
                  strings={strings}
                  isBleConnected={bluetoothState.status === 'connected'}
                  isUsbConnected={usbState.status === 'connected'}
                />
              )}
            </div>
          </div>

          {/* Bottom Bar: Big Connect, Connect USB, Big Flash, and Pairing button */}
          <BottomBar
            bluetoothState={bluetoothState}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            usbState={usbState}
            onConnectUsb={handleConnectUsb}
            onDisconnectUsb={handleDisconnectUsb}
            isUsbSupported={usbSerialService.isSupported()}
            onFlash={handleFlash}
            onOpenPairingHelp={() => setShowPairingModal(true)}
            onToggleSerial={() => setIsSerialOpen(!isSerialOpen)}
            isSerialOpen={isSerialOpen}
            strings={strings}
          />
        </div>
      )}

      {/* Modals */}
      {showExtensionsModal && (
        <ExtensionsModal
          installedExtensions={activeProject.extensions}
          onToggleExtension={handleToggleExtension}
          onClose={() => setShowExtensionsModal(false)}
          strings={strings}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={activeProject.settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
          strings={strings}
        />
      )}

      {showPairingModal && (
        <PairingHelpModal
          onClose={() => setShowPairingModal(false)}
          strings={strings}
        />
      )}

      {showBtUnsupportedModal && (
        <BluetoothNotSupportedModal
          onClose={() => setShowBtUnsupportedModal(false)}
          strings={strings}
        />
      )}
    </div>
  );
}
