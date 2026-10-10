/**
 * MB2ESP Virtual Hardware Simulator
 * Simulates:
 * - 128x64 OLED monochrome display (SSD1306 style)
 * - Tactile Button A, Button B, and Button A+B events
 * - Hardware Reset (RST)
 * - GPIO Pins P0 to P8 (digital, analog, servo)
 * - Serial output
 */

import { USABLE_GPIOS } from '../board/pinMap';

export interface SimulatorPinState {
  digital: number; // 0 or 1
  analog: number; // 0 to 1023
  servoAngle: number | null; // 0 to 180
}

export interface SimulatorState {
  buttonA: boolean;
  buttonB: boolean;
  runningTime: number;
  pins: Record<number, SimulatorPinState>;
  isRunning: boolean;
}

export type SimulatorLogListener = (msg: string) => void;

export class MB2ESPSimulator {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D | null;
  private state: SimulatorState;
  private startTime: number = Date.now();
  private abortController: AbortController | null = null;
  private logListeners: Set<SimulatorLogListener> = new Set();
  private buttonHandlers: { [key: string]: (() => Promise<void>)[] } = {
    A: [],
    B: [],
    AB: []
  };
  private onStateChange: ((state: SimulatorState) => void) | null = null;
  private onRequestRestart: (() => void) | null = null;

  constructor() {
    this.state = this.getInitialState();
    // Initialize 128x64 offscreen buffer
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = 128;
    this.offscreen.height = 64;
    this.offCtx = this.offscreen.getContext('2d');
    this.oledClear();
  }

  private getInitialState(): SimulatorState {
    const pins: Record<number, SimulatorPinState> = {};
    for (const gpio of USABLE_GPIOS) {
      pins[gpio] = { digital: 0, analog: 0, servoAngle: null };
    }
    return {
      buttonA: false,
      buttonB: false,
      runningTime: 0,
      pins,
      isRunning: false
    };
  }

  public setCanvas(canvas: HTMLCanvasElement | null): void {
    this.canvas = canvas;
    if (canvas) {
      this.ctx = canvas.getContext('2d');
      this.render();
    }
  }

  public setStateListener(cb: (state: SimulatorState) => void): void {
    this.onStateChange = cb;
    cb(this.state);
  }

  public setRestartListener(cb: () => void): void {
    this.onRequestRestart = cb;
  }

  public addLogListener(cb: SimulatorLogListener): () => void {
    this.logListeners.add(cb);
    return () => this.logListeners.delete(cb);
  }

  private emitLog(text: string): void {
    this.logListeners.forEach(fn => fn(text));
  }

  private notify(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
    this.render();
  }

  // --- OLED Display APIs (128x64) ---

  public oledClear(): void {
    if (this.offCtx) {
      this.offCtx.fillStyle = '#050B12'; // OLED black/off
      this.offCtx.fillRect(0, 0, 128, 64);
    }
    this.notify();
  }

  public oledText(text: string, x: number, y: number): void {
    if (!this.offCtx) return;
    const str = String(text);

    // SSD1306 8-pixel tall monospace font
    this.offCtx.font = '8px monospace, Courier';
    this.offCtx.textBaseline = 'top';
    this.offCtx.textAlign = 'left';

    // Clear background behind text to prevent smearing
    const textWidth = this.offCtx.measureText(str).width || str.length * 6;
    this.offCtx.fillStyle = '#050B12';
    this.offCtx.fillRect(x, y, Math.min(128 - x, textWidth + 2), 9);

    // Draw sharp OLED cyan text
    this.offCtx.fillStyle = '#00E5FF';
    this.offCtx.fillText(str, x, y);

    this.notify();
  }

  public oledLine(x1: number, y1: number, x2: number, y2: number): void {
    if (!this.offCtx) return;
    this.offCtx.strokeStyle = '#00E5FF';
    this.offCtx.lineWidth = 1;
    this.offCtx.beginPath();
    this.offCtx.moveTo(x1, y1);
    this.offCtx.lineTo(x2, y2);
    this.offCtx.stroke();
    this.notify();
  }

  public oledRect(x: number, y: number, w: number, h: number): void {
    if (!this.offCtx) return;
    this.offCtx.strokeStyle = '#00E5FF';
    this.offCtx.lineWidth = 1;
    this.offCtx.strokeRect(x, y, w, h);
    this.notify();
  }

  // --- Buttons ---

  public async pressButton(btn: 'A' | 'B' | 'AB'): Promise<void> {
    if (btn === 'A') {
      this.state.buttonA = true;
    } else if (btn === 'B') {
      this.state.buttonB = true;
    } else {
      this.state.buttonA = true;
      this.state.buttonB = true;
    }
    this.notify();

    // Trigger handlers
    const handlers = this.buttonHandlers[btn] || [];
    for (const h of handlers) {
      h().catch(e => console.error('Button handler err:', e));
    }

    // Release after 200ms
    setTimeout(() => {
      if (btn === 'A') this.state.buttonA = false;
      else if (btn === 'B') this.state.buttonB = false;
      else {
        this.state.buttonA = false;
        this.state.buttonB = false;
      }
      this.notify();
    }, 200);
  }

  public isButtonPressed(btn: 'A' | 'B'): boolean {
    return btn === 'A' ? this.state.buttonA : this.state.buttonB;
  }

  public registerButtonHandler(btn: 'A' | 'B' | 'AB', fn: () => Promise<void>): void {
    if (!this.buttonHandlers[btn]) this.buttonHandlers[btn] = [];
    this.buttonHandlers[btn].push(fn);
  }

  // --- Pins ---

  public pinWrite(pin: number, val: number): void {
    if (!this.state.pins[pin]) {
      this.state.pins[pin] = { digital: 0, analog: 0, servoAngle: null };
    }
    this.state.pins[pin].digital = val ? 1 : 0;
    this.notify();
  }

  public analogWrite(pin: number, val: number): void {
    if (!this.state.pins[pin]) {
      this.state.pins[pin] = { digital: 0, analog: 0, servoAngle: null };
    }
    this.state.pins[pin].analog = Math.max(0, Math.min(1023, Math.round(val)));
    this.state.pins[pin].digital = val > 0 ? 1 : 0;
    this.notify();
  }

  public pinRead(pin: number): number {
    return this.state.pins[pin]?.digital ?? 0;
  }

  public analogRead(pin: number): number {
    return this.state.pins[pin]?.analog ?? 0;
  }

  public servo(pin: number, angle: number): void {
    if (!this.state.pins[pin]) {
      this.state.pins[pin] = { digital: 0, analog: 0, servoAngle: null };
    }
    this.state.pins[pin].servoAngle = Math.max(0, Math.min(180, angle));
    this.notify();
  }

  public runningTime(): number {
    return Date.now() - this.startTime;
  }

  public async pause(ms: number): Promise<void> {
    if (this.abortController?.signal.aborted) {
      throw new Error('SIMULATION_STOPPED');
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.abortController?.signal.aborted) {
          reject(new Error('SIMULATION_STOPPED'));
        } else {
          resolve();
        }
      }, ms);

      this.abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('SIMULATION_STOPPED'));
      });
    });
  }

  // --- Runner Controls ---

  public stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.buttonHandlers = { A: [], B: [], AB: [] };
    this.state.isRunning = false;
    this.notify();
  }

  /**
   * Reset hardware state and request code execution restart
   */
  public restart(): void {
    this.stop();
    this.oledClear();
    this.startTime = Date.now();
    this.abortController = new AbortController();
    this.state.isRunning = true;
    this.notify();

    // Trigger workspace execution restart callback if registered
    if (this.onRequestRestart) {
      this.onRequestRestart();
    }
  }

  public prepareNewRun(): AbortSignal {
    this.stop();
    this.oledClear();
    this.startTime = Date.now();
    this.abortController = new AbortController();
    this.state.isRunning = true;
    this.notify();
    return this.abortController.signal;
  }

  public getAbortSignal(): AbortSignal | null {
    return this.abortController?.signal || null;
  }

  // --- Blit Offscreen Buffer onto Canvas ---

  public render(): void {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Draw black border/bezel
    ctx.fillStyle = '#02060A';
    ctx.fillRect(0, 0, width, height);

    // Blit 128x64 offscreen buffer scaled to canvas
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.offscreen, 0, 0, width, height);

    // Subtle OLED scanline effect
    ctx.fillStyle = 'rgba(0, 229, 255, 0.04)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1);
    }
  }
}
