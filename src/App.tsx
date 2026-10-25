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
import { loadSavedBoardId, persistBoardId, cleanBoardId, isValidBoardId } from './utils/boardId';

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
import { FirmwareInstallerModal } from './components/FirmwareInstallerModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'editor'>('editor');
  const [projects, setProjects] = useState<Project[]>(() => getAllProjects());
  const [activeProject, setActiveProject] = useState<Project>(() => {
    const activeId = getActiveProjectId();
    const found = activeId ? getProjectById(activeId) : null;
    return found || projects[0] || createNewProject();
  });

  // Classroom Board ID & status notice
  const [boardId, setBoardId] = useState<string>(() => loadSavedBoardId());
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

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
  const [showFirmwareModal, setShowFirmwareModal] = useState(false);

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

  // Handle Board ID input
  const handleBoardIdChange = (newId: string) => {
    setBoardId(newId);
    setStatusNotice(null);
    if (isValidBoardId(newId)) {
      persistBoardId(newId);
    }
  };

  // Helper to compile Python code including any installed extensions
  const getFullPythonCode = (): string => {
    const extPys = activeProject.extensions.map(e => `# Extension: ${e.name}\n${e.extPy}`).join('\n\n');
    return extPys ? `${extPys}\n\n${activeProject.pythonCode}` : activeProject.pythonCode;
  };

  // Upload routine over Bluetooth
  const doBleUpload = async (codeToUpload: string) => {
    setSerialLogs(prev => [
      ...prev,
      `\n[MB2ESP BLE] Starting upload to main.py (${codeToUpload.length} bytes)...`
    ]);
    await bluetoothService.flashCode(
      codeToUpload,
      activeProject.settings?.bleChunkSize || 180
    );
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.85 }
    });
    setSerialLogs(prev => [
      ...prev,
      `[MB2ESP BLE] Uploaded! The board restarted with your program.\n`
    ]);
  };

  // Upload routine over USB
  const doUsbUpload = async (codeToUpload: string) => {
    setSerialLogs(prev => [
      ...prev,
      `\n[MB2ESP USB] Starting upload to main.py (${codeToUpload.length} bytes)...`
    ]);
    await usbSerialService.flashCode(codeToUpload);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.85 }
    });
    setSerialLogs(prev => [
      ...prev,
      `[MB2ESP USB] Uploaded! The board restarted with your program.\n`
    ]);
  };

  /**
   * Upload via Bluetooth
   * 1. If already connected over Bluetooth to a device whose name equals the Board ID, upload straight away.
   * 2. Otherwise, if connected to a different board, disconnect it first.
   * 3. Call navigator.bluetooth.requestDevice({ filters: [{ name: boardId }], optionalServices: [...] })
   *    as the very first await in this click handler.
   * 4. Connect, get service & chars, start notifications, then upload immediately (same click).
   * 5. Board restarts after upload, connection drops (expected).
   * 6. If cancelled or NotFoundError, show friendly message.
   */
  const handleUploadBluetooth = async () => {
    const cleanId = cleanBoardId(boardId);
    if (!isValidBoardId(cleanId)) {
      setStatusNotice('Please enter a valid 6-character hex Board ID.');
      return;
    }
    setStatusNotice(null);

    const fullPythonCode = getFullPythonCode();

    // 1. If already connected over Bluetooth to this exact board, upload straight away
    if (bluetoothService.isConnected() && bluetoothService.getConnectedDeviceName() === cleanId) {
      try {
        await doBleUpload(fullPythonCode);
      } catch (err: any) {
        setStatusNotice(err.message || 'Bluetooth upload failed');
      }
      return;
    }

    // 2. Otherwise, if connected to a different board, disconnect first
    if (bluetoothService.isConnected()) {
      bluetoothService.disconnectSync();
    }

    // 3. Request device - FIRST AWAIT in click handler
    if (!bluetoothService.isSupported()) {
      setShowBtUnsupportedModal(true);
      return;
    }

    let device: any;
    try {
      const navBt = (navigator as any).bluetooth;
      device = await navBt.requestDevice({
        filters: [{ name: cleanId }],
        optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']
      });
    } catch (err: any) {
      if (err.name === 'NotFoundError' || err.message?.includes('cancelled') || err.message?.includes('User cancelled')) {
        const notFoundMsg = `Board ${cleanId} not found. Put the board in Bluetooth mode: hold button A while switching the board on. Or switch it on and press A while the screen says 'Press A'. The screen then shows your Board ID in big letters (${cleanId}). Is the board switched on?`;
        setStatusNotice(notFoundMsg);
        return;
      }
      setStatusNotice((err.message || 'Bluetooth connection cancelled') + '. Is the board switched on?');
      return;
    }

    // 4. Connect and upload immediately (same click)
    try {
      await bluetoothService.connectDevice(device);
      await doBleUpload(fullPythonCode);
    } catch (err: any) {
      console.error('BLE connection or upload failed:', err);
      setStatusNotice((err.message || 'Failed to upload via Bluetooth') + '. Is the board switched on?');
    }
  };

  /**
   * Upload via USB
   * 1. If the USB port is already open, upload straight away.
   * 2. Otherwise call navigator.serial.requestPort({ filters: [{ usbVendorId: 0x303A }] }) as the first await,
   *    open it, then upload immediately (same click).
   * 3. If port is lost (board unplugged), forget it so the next click asks again.
   */
  const handleUploadUsb = async () => {
    setStatusNotice(null);
    const fullPythonCode = getFullPythonCode();

    // 1. If already open, upload straight away
    if (usbSerialService.isConnected()) {
      try {
        await doUsbUpload(fullPythonCode);
      } catch (err: any) {
        setStatusNotice((err.message || 'USB upload failed') + '. Is the board switched on?');
      }
      return;
    }

    // 2. Request port - FIRST AWAIT in click handler
    if (!usbSerialService.isSupported()) {
      setStatusNotice('Web Serial is not supported in this browser. Please use Chrome or Edge on desktop.');
      return;
    }

    let port: any;
    try {
      const navSerial = (navigator as any).serial;
      port = await navSerial.requestPort({
        filters: [{ usbVendorId: 0x303A }]
      });
    } catch (err: any) {
      if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
        setStatusNotice('USB device not found or selection cancelled. Is the board switched on?');
        return;
      }
      setStatusNotice((err.message || 'USB selection cancelled') + '. Is the board switched on?');
      return;
    }

    // Open port and upload immediately (same click)
    try {
      await usbSerialService.openPort(port);
      await doUsbUpload(fullPythonCode);
    } catch (err: any) {
      console.error('USB open or upload failed:', err);
      setStatusNotice((err.message || 'Failed to upload via USB') + '. Is the board switched on?');
    }
  };

  // Disconnect Bluetooth
  const handleDisconnectBluetooth = async () => {
    setStatusNotice(null);
    await bluetoothService.disconnect();
  };

  // Disconnect USB
  const handleDisconnectUsb = async () => {
    setStatusNotice(null);
    await usbSerialService.disconnect();
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
            targetBoardId={boardId}
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

          {/* Bottom Bar: Board ID, Upload via Bluetooth, Upload via USB, Status */}
          <BottomBar
            bluetoothState={bluetoothState}
            usbState={usbState}
            boardId={boardId}
            onBoardIdChange={handleBoardIdChange}
            onUploadBluetooth={handleUploadBluetooth}
            onDisconnectBluetooth={handleDisconnectBluetooth}
            onUploadUsb={handleUploadUsb}
            onDisconnectUsb={handleDisconnectUsb}
            isUsbSupported={usbSerialService.isSupported()}
            onOpenPairingHelp={() => setShowPairingModal(true)}
            onToggleSerial={() => setIsSerialOpen(!isSerialOpen)}
            isSerialOpen={isSerialOpen}
            strings={strings}
            statusNotice={statusNotice}
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
          onOpenFirmwareInstaller={() => setShowFirmwareModal(true)}
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

      {showFirmwareModal && (
        <FirmwareInstallerModal
          onClose={() => setShowFirmwareModal(false)}
        />
      )}
    </div>
  );
}
