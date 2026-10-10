import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Pause, Terminal, Cpu } from 'lucide-react';
import { MB2ESPSimulator, SimulatorState } from '../simulator/MB2ESPSimulator';
import { AppStrings } from '../i18n/strings';

interface SimulatorPanelProps {
  simulator: MB2ESPSimulator;
  strings: AppStrings;
  onToggleSerial: () => void;
  isSerialOpen: boolean;
}

export const SimulatorPanel: React.FC<SimulatorPanelProps> = ({
  simulator,
  strings,
  onToggleSerial,
  isSerialOpen
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [simState, setSimState] = useState<SimulatorState>(() => (simulator as any).state);
  const [showPins, setShowPins] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      simulator.setCanvas(canvasRef.current);
    }
    simulator.setStateListener(state => {
      setSimState(state);
    });
  }, [simulator]);

  const handleReset = () => {
    simulator.restart();
  };

  const handleToggleRun = () => {
    if (simState.isRunning) {
      simulator.stop();
    } else {
      simulator.restart();
    }
  };

  return (
    <div className="flex flex-col bg-slate-900 border-r border-slate-800 w-80 lg:w-96 select-none shrink-0 h-full">
      {/* Simulator Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
            {strings.simulator}
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.2 rounded font-mono font-semibold">
            MB2ESP v2.1
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPins(!showPins)}
            className={`px-2 py-1 text-xs rounded transition font-medium ${
              showPins ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle GPIO Pin Monitor"
          >
            Pins
          </button>
          <button
            onClick={onToggleSerial}
            className={`p-1.5 rounded transition ${
              isSerialOpen ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title={strings.serialConsole}
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hardware Board Representation */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-y-auto">
        <div className="relative w-full max-w-[320px] aspect-[1/1.1] rounded-3xl bg-gradient-to-br from-[#121E2A] via-[#0E1722] to-[#0A1018] p-5 shadow-2xl border-2 border-slate-700/80 flex flex-col items-center justify-between">
          {/* Subtle PCB traces styling */}
          <div className="absolute inset-0 rounded-3xl opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Board Markings & Reset Button */}
          <div className="w-full flex items-center justify-between z-10 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
              <span className="font-black text-xs tracking-wider text-slate-200">MB2ESP</span>
            </div>

            {/* Hardware Reset button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                title={strings.resetButton}
                className="group flex flex-col items-center"
              >
                <div className="w-6 h-6 rounded-full bg-red-800 hover:bg-red-700 active:scale-90 border-2 border-red-500 shadow-md flex items-center justify-center transition">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                </div>
                <span className="text-[9px] font-bold text-red-400 group-hover:text-red-300 mt-0.5">RST</span>
              </button>
            </div>
          </div>

          {/* Central OLED 128x64 Display */}
          <div className="w-full flex flex-col items-center my-auto z-10">
            <div className="w-full max-w-[240px] aspect-[2/1] bg-black p-2 rounded-xl shadow-inner border-4 border-slate-800 relative flex flex-col items-center justify-center">
              <div className="text-[8px] text-slate-500 font-mono tracking-widest absolute top-1 uppercase">
                128×64 OLED
              </div>

              <canvas
                ref={canvasRef}
                width={128}
                height={64}
                className="w-full h-full object-contain rounded image-rendering-pixelated"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>

          {/* Tactile Buttons A, A+B, B */}
          <div className="w-full flex items-center justify-between px-3 z-10 mb-2">
            {/* Button A */}
            <div className="flex flex-col items-center">
              <button
                onPointerDown={() => simulator.pressButton('A')}
                className={`w-12 h-12 rounded-full border-4 transition-all duration-150 flex items-center justify-center font-bold text-base shadow-lg touch-manipulation ${
                  simState.buttonA
                    ? 'bg-amber-500 border-amber-300 text-slate-950 scale-95 shadow-[0_0_15px_#f59e0b]'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100 hover:border-slate-400'
                }`}
              >
                A
              </button>
              <span className="text-[10px] text-slate-400 font-mono mt-1 font-semibold">BTN A</span>
            </div>

            {/* Button A+B combo */}
            <div className="flex flex-col items-center">
              <button
                onPointerDown={() => simulator.pressButton('AB')}
                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition shadow touch-manipulation ${
                  simState.buttonA && simState.buttonB
                    ? 'bg-amber-500 border-amber-300 text-slate-950 scale-95'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-600/70 text-slate-300'
                }`}
                title="Press Both A and B"
              >
                A + B
              </button>
            </div>

            {/* Button B */}
            <div className="flex flex-col items-center">
              <button
                onPointerDown={() => simulator.pressButton('B')}
                className={`w-12 h-12 rounded-full border-4 transition-all duration-150 flex items-center justify-center font-bold text-base shadow-lg touch-manipulation ${
                  simState.buttonB
                    ? 'bg-amber-500 border-amber-300 text-slate-950 scale-95 shadow-[0_0_15px_#f59e0b]'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100 hover:border-slate-400'
                }`}
              >
                B
              </button>
              <span className="text-[10px] text-slate-400 font-mono mt-1 font-semibold">BTN B</span>
            </div>
          </div>

          {/* Bottom Edge Gold Contacts / Pins */}
          <div className="w-full pt-1 border-t-2 border-slate-800/80 flex items-end justify-between px-1 z-10">
            {['P0', 'P1', 'P2', '3V3', 'GND'].map((pinLabel, idx) => {
              const isPin = idx < 3;
              const isHigh = isPin && simState.pins[idx]?.digital === 1;
              return (
                <div key={pinLabel} className="flex flex-col items-center">
                  <span className={`text-[8px] font-mono font-bold mb-0.5 ${
                    isHigh ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {pinLabel}
                  </span>
                  <div className={`w-8 h-4 rounded-t-sm border border-amber-600/40 ${
                    isHigh
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-gradient-to-t from-amber-600 to-amber-500/70'
                  }`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Pin Monitor Drawer */}
        {showPins && (
          <div className="w-full mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="font-semibold text-slate-300 text-[11px] mb-2 uppercase tracking-wide">
              {strings.pins} Monitor (P0 - P8)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(simState.pins).map(([pinKey, state]) => {
                const pinNum = parseInt(pinKey, 10);
                return (
                  <div key={pinKey} className="bg-slate-900 border border-slate-800 rounded p-1.5 flex flex-col">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono text-slate-400 font-bold">P{pinNum}</span>
                      <span className={`px-1 rounded text-[9px] font-bold ${
                        state.digital ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {state.digital ? 'HIGH' : 'LOW'}
                      </span>
                    </div>
                    {state.servoAngle !== null && (
                      <div className="text-[9px] text-emerald-400 mt-1 font-mono">
                        Servo: {state.servoAngle}°
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Simulator Controls Toolbar */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRun}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition shadow ${
              simState.isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {simState.isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={strings.simulatorReset}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          {Math.floor(simState.runningTime / 1000)}s
        </span>
      </div>
    </div>
  );
};
