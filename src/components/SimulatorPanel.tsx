import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Pause, Terminal, Cpu, Sparkles, BatteryCharging } from 'lucide-react';
import { MB2ESPSimulator, SimulatorState } from '../simulator/MB2ESPSimulator';
import { AppStrings } from '../i18n/strings';
import { PIXL_PINS } from '../board/pinMap';

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

  const led = simState.ledColor || { r: 0, g: 0, b: 0 };
  const brightness = simState.ledBrightness !== undefined ? simState.ledBrightness : 255;
  const scale = brightness / 255;
  const adjR = Math.round(led.r * scale);
  const adjG = Math.round(led.g * scale);
  const adjB = Math.round(led.b * scale);
  const isLedLit = (adjR > 0 || adjG > 0 || adjB > 0) && brightness > 0;
  const rgbColorString = `rgb(${adjR}, ${adjG}, ${adjB})`;

  return (
    <div className="flex flex-col bg-slate-900 border-r border-slate-800 w-80 lg:w-[380px] select-none shrink-0 h-full">
      {/* Simulator Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
            {strings.simulator}
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono font-semibold">
            PIXL Board
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPins(!showPins)}
            className={`px-2 py-1 text-xs rounded transition font-medium ${
              showPins ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle GPIO Pin Monitor (10 Pins)"
          >
            10 Pins
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

      {/* Hardware Board Representation: Square PIXL Board */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-y-auto">
        <div className="relative w-full max-w-[340px] aspect-square rounded-3xl bg-gradient-to-br from-[#131F2E] via-[#0D1622] to-[#080E17] p-4 shadow-2xl border-2 border-slate-700/80 flex flex-col justify-between">
          {/* Subtle PCB pattern */}
          <div className="absolute inset-0 rounded-3xl opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Corner gold mounting holes */}
          <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full border border-amber-500/60 bg-slate-950/80 shadow-inner flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
          </div>
          <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full border border-amber-500/60 bg-slate-950/80 shadow-inner flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
          </div>
          <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full border border-amber-500/60 bg-slate-950/80 shadow-inner flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
          </div>
          <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full border border-amber-500/60 bg-slate-950/80 shadow-inner flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
          </div>

          {/* Top Row: Brand & Reset */}
          <div className="w-full flex items-center justify-between z-10 px-2 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse" />
              <span className="font-black text-xs tracking-wider text-slate-100">PIXL</span>
              <span className="text-[9px] font-mono font-semibold text-slate-400">ESP32-S3</span>
            </div>

            {/* Hardware Reset button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                title={strings.resetButton}
                className="group flex flex-col items-center"
              >
                <div className="w-5 h-5 rounded-full bg-red-800 hover:bg-red-700 active:scale-90 border border-red-500 shadow-md flex items-center justify-center transition">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                </div>
                <span className="text-[8px] font-bold text-red-400 group-hover:text-red-300">RST</span>
              </button>
            </div>
          </div>

          {/* Upper Section: Buttons A & B surrounding screen top */}
          <div className="w-full flex items-center justify-between px-2 z-10">
            {/* Button A (Top-Left) */}
            <div className="flex flex-col items-center">
              <button
                onPointerDown={() => simulator.pressButton('A')}
                className={`w-11 h-11 rounded-full border-2 transition-all duration-150 flex items-center justify-center font-bold text-sm shadow-lg touch-manipulation cursor-pointer ${
                  simState.buttonA
                    ? 'bg-amber-500 border-amber-300 text-slate-950 scale-95 shadow-[0_0_15px_#f59e0b]'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100 hover:border-slate-400'
                }`}
                title="Button A (Top-Left, GPIO41)"
              >
                A
              </button>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5 font-semibold">BTN A</span>
            </div>

            {/* Center Top: RGB LED */}
            <div className="flex flex-col items-center">
              <div
                className="relative w-6 h-6 rounded-full border border-slate-600/80 flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: isLedLit ? rgbColorString : '#1a2230',
                  boxShadow: isLedLit
                    ? `0 0 14px ${rgbColorString}, 0 0 28px ${rgbColorString}`
                    : 'inset 0 1px 2px rgba(0,0,0,0.6)'
                }}
                title={
                  isLedLit
                    ? `RGB LED: (${adjR}, ${adjG}, ${adjB}) [Brightness: ${brightness}]`
                    : 'WS2812 RGB LED (Off)'
                }
              >
                <div
                  className="w-2.5 h-2.5 rounded-full border border-white/30"
                  style={{
                    backgroundColor: isLedLit ? '#ffffff' : '#334155'
                  }}
                />
              </div>
              <span className="text-[8px] text-slate-400 font-mono mt-1 font-semibold flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-pink-400 inline" />
                RGB LED
              </span>
            </div>

            {/* Button B (Top-Right) */}
            <div className="flex flex-col items-center">
              <button
                onPointerDown={() => simulator.pressButton('B')}
                className={`w-11 h-11 rounded-full border-2 transition-all duration-150 flex items-center justify-center font-bold text-sm shadow-lg touch-manipulation cursor-pointer ${
                  simState.buttonB
                    ? 'bg-amber-500 border-amber-300 text-slate-950 scale-95 shadow-[0_0_15px_#f59e0b]'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100 hover:border-slate-400'
                }`}
                title="Button B (Top-Right, GPIO42)"
              >
                B
              </button>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5 font-semibold">BTN B</span>
            </div>
          </div>

          {/* Center: OLED 128x64 Display */}
          <div className="w-full flex flex-col items-center z-10 px-1 my-1">
            <div className="w-full max-w-[230px] aspect-[2/1] bg-black p-1.5 rounded-xl shadow-inner border-4 border-slate-800 relative flex flex-col items-center justify-center">
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

          {/* Lower Section: Buttons X & Y surrounding screen bottom + A+B Combo */}
          <div className="w-full flex items-center justify-between px-2 z-10">
            {/* Button X (Bottom-Left) */}
            <div className="flex flex-col items-center">
              <button
                onPointerDown={() => simulator.pressButton('X')}
                className={`w-11 h-11 rounded-full border-2 transition-all duration-150 flex items-center justify-center font-bold text-sm shadow-lg touch-manipulation cursor-pointer ${
                  simState.buttonX
                    ? 'bg-amber-500 border-amber-300 text-slate-950 scale-95 shadow-[0_0_15px_#f59e0b]'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100 hover:border-slate-400'
                }`}
                title="Button X (Bottom-Left, GPIO40)"
              >
                X
              </button>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5 font-semibold">BTN X</span>
            </div>

            {/* Center Bottom: A+B Combo Button */}
            <div className="flex flex-col items-center">
              <button
                onPointerDown={() => simulator.pressButton('AB')}
                className={`px-3 py-1 rounded-lg border text-xs font-bold transition shadow touch-manipulation cursor-pointer ${
                  simState.buttonA && simState.buttonB
                    ? 'bg-amber-500 border-amber-300 text-slate-950 scale-95'
                    : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Press A + B simultaneously"
              >
                A + B
              </button>
            </div>

            {/* Button Y (Bottom-Right) */}
            <div className="flex flex-col items-center">
              <button
                onPointerDown={() => simulator.pressButton('Y')}
                className={`w-11 h-11 rounded-full border-2 transition-all duration-150 flex items-center justify-center font-bold text-sm shadow-lg touch-manipulation cursor-pointer ${
                  simState.buttonY
                    ? 'bg-amber-500 border-amber-300 text-slate-950 scale-95 shadow-[0_0_15px_#f59e0b]'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100 hover:border-slate-400'
                }`}
                title="Button Y (Bottom-Right, GPIO47)"
              >
                Y
              </button>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5 font-semibold">BTN Y</span>
            </div>
          </div>

          {/* Bottom Edge Header Pins (10 Pins) */}
          <div className="w-full pt-1.5 border-t border-slate-800 flex items-end justify-between px-1 z-10">
            {PIXL_PINS.map(pinDef => {
              const gpio = pinDef.gpio;
              const isHigh = simState.pins[gpio]?.digital === 1;
              const isServo = simState.pins[gpio]?.servoAngle !== null;
              const isBattSocket = gpio === 4;

              return (
                <div
                  key={pinDef.label}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => simulator.pinWrite(gpio, isHigh ? 0 : 1)}
                  title={
                    isBattSocket
                      ? `${pinDef.label}: 3-pin socket with battery power for servos`
                      : `${pinDef.label}: Digital=${isHigh ? 1 : 0}, ADC=${simState.pins[gpio]?.analog || 0}`
                  }
                >
                  <span
                    className={`text-[7px] font-mono font-bold mb-0.5 transition ${
                      isHigh
                        ? 'text-amber-400'
                        : isBattSocket
                        ? 'text-emerald-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {pinDef.gpio}
                  </span>
                  <div
                    className={`w-5 sm:w-6 h-3 rounded-t-sm border border-amber-600/40 transition ${
                      isHigh
                        ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                        : isServo
                        ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                        : isBattSocket
                        ? 'bg-gradient-to-t from-emerald-600 to-amber-500'
                        : 'bg-gradient-to-t from-amber-600 to-amber-500/70'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Pin Monitor Drawer for the 10 Pins */}
        {showPins && (
          <div className="w-full mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-200 text-[11px] uppercase tracking-wide">
                PIXL GPIO Monitor (10 Pins)
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                Click pin to toggle
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mb-2 font-mono flex items-center justify-between">
              <span>Pins: 1, 2, 4, 5, 6, 7, 10, 11, 12, 13</span>
              <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                <BatteryCharging className="w-3 h-3 inline" />
                H6/GPIO4 = Servo 3-Pin Socket
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PIXL_PINS.map(pinDef => {
                const gpio = pinDef.gpio;
                const state = simState.pins[gpio] || { digital: 0, analog: 0, servoAngle: null };
                const isBatteryPin = gpio === 4;

                return (
                  <div
                    key={pinDef.label}
                    className={`border rounded p-1.5 flex flex-col ${
                      isBatteryPin
                        ? 'bg-emerald-950/20 border-emerald-800/50'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-slate-200 font-bold">{pinDef.label}</span>
                        {isBatteryPin && (
                          <span className="text-[8px] bg-emerald-900/80 text-emerald-300 px-1 rounded font-semibold" title="Battery power for motor">
                            Servo 3P
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => simulator.pinWrite(gpio, state.digital ? 0 : 1)}
                        className={`px-1 rounded text-[9px] font-bold cursor-pointer transition ${
                          state.digital ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                        }`}
                        title="Click to toggle digital input state"
                      >
                        {state.digital ? 'HIGH' : 'LOW'}
                      </button>
                    </div>
                    {pinDef.supportsAnalog && (
                      <div className="text-[9px] text-sky-400 mt-0.5 font-mono flex justify-between">
                        <span>ADC: {state.analog}</span>
                        {!pinDef.analogAlwaysWorks ? (
                          <span className="text-[8px] text-slate-500" title="Disabled when Wi-Fi active">No Wi-Fi</span>
                        ) : (
                          <span className="text-[8px] text-sky-500/80">Always</span>
                        )}
                      </div>
                    )}
                    {state.servoAngle !== null && (
                      <div className="text-[9px] text-emerald-400 mt-0.5 font-mono">
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
