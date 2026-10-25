import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  AlertTriangle,
  Cpu,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Loader2,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  verifyFirmwarePassword,
  isFirmwareUnlocked,
  setFirmwareUnlocked,
  fetchManifest,
  triggerBootloader,
  flashFirmwareBinary,
  tryFindPixlPort,
  copyPixlFiles,
  FirmwareManifest
} from '../services/firmwareInstaller';
import { usbSerialService } from '../services/usbSerial';

interface FirmwareInstallerModalProps {
  onClose: () => void;
}

type WizardStep = 'password' | 'warning' | 'install_mode' | 'flashing' | 'copying' | 'done';

export const FirmwareInstallerModal: React.FC<FirmwareInstallerModalProps> = ({ onClose }) => {
  const isWebSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  // Password state
  const [isUnlocked, setIsUnlocked] = useState(isFirmwareUnlocked());
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);

  // Wizard state
  const [step, setStep] = useState<WizardStep>(isFirmwareUnlocked() ? 'warning' : 'password');
  const [warningChecked, setWarningChecked] = useState(false);

  // Manifest
  const [manifest, setManifest] = useState<FirmwareManifest | null>(null);
  const manifestRef = useRef<FirmwareManifest | null>(null);

  // Step 4 manual selection state
  const [needsManualPortSelection, setNeedsManualPortSelection] = useState(false);

  // Progress & status
  const [flashProgress, setFlashProgress] = useState(0);
  const [fileProgress, setFileProgress] = useState({ current: 0, total: 0, fileName: '' });
  const [isBusy, setIsBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState('');

  // Logs & errors
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawErrorDetails, setRawErrorDetails] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-250), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Pre-load manifest once unlocked
  useEffect(() => {
    if (isUnlocked) {
      // Disconnect active editor serial if open
      if (usbSerialService.isConnected()) {
        usbSerialService.disconnect().catch(() => {});
      }

      fetchManifest()
        .then(m => {
          setManifest(m);
          manifestRef.current = m;
          addLog(`Loaded firmware manifest version: ${m.version}`);
        })
        .catch(err => {
          addLog(`Manifest load warning: ${err.message}`);
        });
    }
  }, [isUnlocked]);

  // Handle password submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    setIsCheckingPassword(true);
    setPasswordError('');

    try {
      const valid = await verifyFirmwarePassword(passwordInput);
      if (valid) {
        setFirmwareUnlocked(true);
        setIsUnlocked(true);
        setStep('warning');
      } else {
        setPasswordError('Wrong password');
      }
    } catch (err: any) {
      setPasswordError('Verification failed: ' + err.message);
    } finally {
      setIsCheckingPassword(false);
    }
  };

  const mapErrorMessage = (err: any): string => {
    const msg = (err?.message || String(err)).toLowerCase();
    if (msg.includes('no_web_serial') || !isWebSerialSupported) {
      return 'Please use Chrome or Edge on a computer.';
    }
    if (msg.includes('busy') || msg.includes('locked') || msg.includes('already open')) {
      return 'The board is used by another program or tab. Close it and try again.';
    }
    if (
      msg.includes('not in install mode') ||
      msg.includes('sync') ||
      msg.includes('timeout waiting for packet') ||
      msg.includes('could not enter')
    ) {
      return 'Board not in install mode. Switch the board on. On the back, hold BOOT, press and release RST, then release BOOT. The screen stays blank; that is normal.';
    }
    if (msg.includes('cancelled') || msg.includes('notfounderror')) {
      return 'Port selection was cancelled. Please select the board to continue.';
    }
    return err.message || 'An unexpected error occurred during installation.';
  };

  const handleError = (err: any) => {
    console.error('Firmware installer error:', err);
    const friendly = mapErrorMessage(err);
    setErrorMessage(friendly);
    setRawErrorDetails(err?.stack || err?.message || String(err));
    setIsBusy(false);
  };

  const handleResetToStep2 = () => {
    setErrorMessage(null);
    setRawErrorDetails(null);
    setIsBusy(false);
    setNeedsManualPortSelection(false);
    setStep('install_mode');
  };

  const handleRetryStep4 = () => {
    setErrorMessage(null);
    setRawErrorDetails(null);
    setIsBusy(false);
    setStep('copying');
    setNeedsManualPortSelection(true);
  };

  // STEP 2: Automatic bootloader trigger
  // RULE: First await inside click handler MUST be requestPort()
  const handleTriggerAutomaticBootloader = async () => {
    if (!('serial' in navigator)) {
      handleError(new Error('NO_WEB_SERIAL'));
      return;
    }

    let port: any;
    try {
      const navSerial = (navigator as any).serial;
      // FIRST AWAIT in click handler
      port = await navSerial.requestPort();
    } catch (e: any) {
      if (e.name === 'NotFoundError' || e.message?.includes('cancelled')) {
        return;
      }
      handleError(e);
      return;
    }

    try {
      setIsBusy(true);
      setBusyMessage('Connecting to board and sending bootloader trigger...');
      setErrorMessage(null);

      await triggerBootloader(port);
      addLog('Board transitioned into ROM bootloader mode.');
      setIsBusy(false);
      setStep('flashing');
    } catch (err: any) {
      handleError(err);
    }
  };

  // STEP 3: Flash MicroPython binary
  // RULE: First await inside click handler MUST be requestPort()
  const handleStartFlash = async () => {
    if (!('serial' in navigator)) {
      handleError(new Error('NO_WEB_SERIAL'));
      return;
    }

    let port: any;
    try {
      const navSerial = (navigator as any).serial;
      // FIRST AWAIT in click handler
      port = await navSerial.requestPort({
        filters: [{ usbVendorId: 0x303A }]
      });
    } catch (e: any) {
      if (e.name === 'NotFoundError' || e.message?.includes('cancelled')) {
        return;
      }
      handleError(e);
      return;
    }

    try {
      setIsBusy(true);
      setBusyMessage('Flashing MicroPython to ESP32-S3...');
      setErrorMessage(null);
      setFlashProgress(0);

      const activeManifest = manifestRef.current || manifest || (await fetchManifest());
      manifestRef.current = activeManifest;
      setManifest(activeManifest);

      await flashFirmwareBinary(
        port,
        activeManifest,
        pct => setFlashProgress(pct),
        msg => addLog(msg)
      );

      setFlashProgress(100);
      addLog('Flash successful. Board hard-reset complete.');

      // Proceed to Step 4 after flash
      await proceedToStep4(activeManifest);
    } catch (err: any) {
      handleError(err);
    }
  };

  // Helper to transition from Step 3 to Step 4
  const proceedToStep4 = async (activeManifest: FirmwareManifest) => {
    setStep('copying');
    setNeedsManualPortSelection(false);
    setIsBusy(true);
    setBusyMessage('Waiting 3 seconds for board filesystem initialization...');
    addLog('Waiting 3 seconds for MicroPython filesystem initialization...');

    await new Promise(r => setTimeout(r, 3000));

    // Try finding already-paired port with product 0x4001
    addLog('Checking for PIXL board port (PID 0x4001) via getPorts()...');
    const autoPort = await tryFindPixlPort();

    if (autoPort) {
      addLog('Found PIXL board port automatically.');
      await executeCopyFilesWithPort(autoPort, activeManifest);
    } else {
      addLog('PIXL board not found automatically in allowed ports. Prompting user selection...');
      setIsBusy(false);
      setNeedsManualPortSelection(true);
    }
  };

  // STEP 4 Manual: User clicks "Select PIXL board"
  // RULE: First await inside click handler MUST be requestPort()
  const handleSelectPixlBoard = async () => {
    if (!('serial' in navigator)) {
      handleError(new Error('NO_WEB_SERIAL'));
      return;
    }

    let port: any;
    try {
      const navSerial = (navigator as any).serial;
      // FIRST AWAIT in click handler
      port = await navSerial.requestPort({
        filters: [{ usbVendorId: 0x303A }]
      });
    } catch (e: any) {
      if (e.name === 'NotFoundError' || e.message?.includes('cancelled')) {
        return;
      }
      handleError(e);
      return;
    }

    const activeManifest = manifestRef.current || manifest || (await fetchManifest());
    manifestRef.current = activeManifest;
    setManifest(activeManifest);

    setNeedsManualPortSelection(false);
    await executeCopyFilesWithPort(port, activeManifest);
  };

  // Core file copying worker with given port
  const executeCopyFilesWithPort = async (port: any, activeManifest: FirmwareManifest) => {
    try {
      setIsBusy(true);
      setErrorMessage(null);
      setBusyMessage('Copying PIXL library files via raw REPL...');

      await copyPixlFiles(
        port,
        activeManifest,
        (current, total, fileName) => {
          setFileProgress({ current, total, fileName });
          setBusyMessage(`Copying files ${current}/${total}: ${fileName}`);
        },
        msg => addLog(msg)
      );

      setIsBusy(false);
      setStep('done');

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      handleError(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] app-modal-overlay flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Install PIXL Firmware</span>
                {manifest && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                    {manifest.chip}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Setup MB2ESP / ESP32-S3 board from scratch over USB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Unsupported Browser Warning */}
          {!isWebSerialSupported && (
            <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl flex items-start gap-3 text-amber-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Web Serial not supported in this browser</p>
                <p className="mt-1 text-amber-200/80">
                  Please use Google Chrome or Microsoft Edge on a desktop computer (Windows, Mac, Linux, or Chromebook) to install firmware over USB.
                </p>
              </div>
            </div>
          )}

          {/* STEP: Password Gate */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-slate-200">Protected Maintenance Tool</p>
                  <p className="text-slate-400 leading-relaxed">
                    This installer erases the board and sets up the PIXL MicroPython firmware. Enter the password to unlock this tool.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter firmware password..."
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
                {passwordError && (
                  <p className="text-xs text-red-400 font-medium">{passwordError}</p>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!passwordInput.trim() || isCheckingPassword}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-950"
                >
                  {isCheckingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Unlock</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 1: Warning */}
          {step === 'warning' && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-amber-300 text-sm">Important Warning</p>
                  <p>
                    This erases everything on the board, including the program on it, and installs PIXL firmware.
                  </p>
                  <p className="text-amber-200/90 font-medium">
                    Keep the USB cable plugged in until it says Done.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={warningChecked}
                  onChange={e => setWarningChecked(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-0 accent-cyan-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-200 select-none">
                  I understand, erase board and install PIXL firmware
                </span>
              </label>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!warningChecked}
                  onClick={() => setStep('install_mode')}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-950"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Put Board in Install Mode */}
          {step === 'install_mode' && (
            <div className="space-y-5">
              <div className="text-xs text-slate-300">
                <p className="font-semibold text-slate-200 mb-1">Step 2: Put the board into install mode</p>
                <p className="text-slate-400">Choose one of the two methods below to put the ESP32-S3 into ROM bootloader mode:</p>
              </div>

              {/* Method A: Automatic */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Method A: Automatic (Already runs PIXL/MicroPython)</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">Easiest</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  If the board already has PIXL or MicroPython installed, click "Connect board" to automatically reboot it into install mode.
                </p>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleTriggerAutomaticBootloader}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 text-xs font-bold transition flex items-center gap-2"
                >
                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Connect board</span>
                </button>
              </div>

              {/* Method B: Manual */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                <span className="text-xs font-bold text-slate-200">Method B: Manual (New board, Arduino board, or recovery)</span>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-amber-300">Hardware Button Sequence:</p>
                  <p className="leading-relaxed">
                    Switch the board on. On the back, hold <strong className="text-white">BOOT</strong>, press and release <strong className="text-white">RST</strong>, then release <strong className="text-white">BOOT</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400 italic">The screen stays blank; that is normal.</p>
                </div>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStep('flashing')}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-950"
                >
                  <span>Continue to Flash</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Flash with esptool-js */}
          {step === 'flashing' && (
            <div className="space-y-5">
              <div className="text-xs text-slate-300">
                <p className="font-semibold text-slate-200 mb-1">Step 3: Flash MicroPython binary</p>
                <p className="text-slate-400">
                  Select your board in install mode (USB Vendor ID 0x303A) to erase flash and write MicroPython.
                </p>
              </div>

              {!isBusy && flashProgress === 0 && (
                <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
                  <Cpu className="w-10 h-10 text-cyan-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">Ready to flash ESP32-S3</p>
                  <button
                    type="button"
                    onClick={handleStartFlash}
                    className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition shadow-lg shadow-cyan-950 active:scale-95"
                  >
                    Select board in install mode
                  </button>
                </div>
              )}

              {isBusy && (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>{busyMessage || 'Flashing...'}</span>
                    </span>
                    <span className="font-mono font-bold text-cyan-400">{flashProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-150"
                      style={{ width: `${flashProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Copy PIXL Files */}
          {step === 'copying' && (
            <div className="space-y-5">
              <div className="text-xs text-slate-300">
                <p className="font-semibold text-slate-200 mb-1">Step 4: Copy PIXL system files</p>
                <p className="text-slate-400">
                  Writing MicroPython drivers (pixl.py, boot.py, main.py, ssd1306, aioble) to board filesystem.
                </p>
              </div>

              {/* If automatic port detection didn't find port, ask user via a big button */}
              {needsManualPortSelection && !isBusy && !errorMessage && (
                <div className="p-6 bg-slate-950 border border-cyan-800/40 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 mx-auto">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Almost done!</p>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                      Click the button and choose the PIXL board (it may have a new name).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectPixlBoard}
                    className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition shadow-lg shadow-cyan-950 active:scale-95"
                  >
                    Select PIXL board
                  </button>
                </div>
              )}

              {isBusy && (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>{busyMessage || 'Writing PIXL files...'}</span>
                    </span>
                    {fileProgress.total > 0 && (
                      <span className="font-mono font-bold text-cyan-400">
                        {fileProgress.current} / {fileProgress.total}
                      </span>
                    )}
                  </div>

                  {fileProgress.total > 0 && (
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div
                        className="bg-cyan-500 h-full transition-all duration-200"
                        style={{
                          width: `${Math.round((fileProgress.current / fileProgress.total) * 100)}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Done */}
          {step === 'done' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-950/50">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Done!</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  The board screen shows <strong className="text-emerald-400">"PIXL ready!"</strong>. You can now upload programs with Bluetooth or USB.
                </p>
              </div>

              {manifest && (
                <div className="inline-block px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
                  Installed: <span className="text-cyan-400 font-bold">{manifest.version}</span>
                </div>
              )}

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950"
                >
                  Close & Start Coding
                </button>
              </div>
            </div>
          )}

          {/* Error Message Box with Step-Aware Retry Buttons */}
          {errorMessage && (
            <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-200 space-y-1">
                  <p className="font-bold text-red-300">Installation Paused</p>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {step === 'copying' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRetryStep4}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-950"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Try again (Step 4 only)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToStep2}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Start over</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetToStep2}
                    className="px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-800/80 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try again</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Collapsible Technical Details / Logs */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              {showLogs ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>Technical Details & Logs</span>
            </button>

            {showLogs && (
              <div className="mt-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-400 max-h-40 overflow-y-auto space-y-1 select-text">
                {rawErrorDetails && (
                  <div className="text-red-400 font-bold mb-1 whitespace-pre-wrap">
                    {rawErrorDetails}
                  </div>
                )}
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic">No logs yet.</div>
                ) : (
                  logs.map((l, i) => <div key={i}>{l}</div>)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
