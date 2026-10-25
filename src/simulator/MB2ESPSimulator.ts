/**
 * PIXL Virtual Hardware Simulator (ESP32-S3)
 * Simulates:
 * - 128x64 OLED monochrome display (SSD1306 style)
 * - Tactile Button A (top-left), Button B (top-right), Button X (bottom-left), Button Y (bottom-right), and A+B
 * - WS2812 RGB LED (full RGB color 0-255)
 * - Hardware Reset (RST)
 * - 10 Usable GPIO Pins (GPIO 1, 2, 4, 5, 6, 7, 10, 11, 12, 13)
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
  buttonX: boolean;
  buttonY: boolean;
  ledColor: { r: number; g: number; b: number };
  ledBrightness: number; // 0 to 255
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
    X: [],
    Y: [],
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
      buttonX: false,
      buttonY: false,
      ledColor: { r: 0, g: 0, b: 0 },
      ledBrightness: 255,
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

  private lastButtonPressTime: { [key: string]: number } = {};

  // --- Buttons (A, B, X, Y, AB) ---

  public async pressButton(btn: 'A' | 'B' | 'X' | 'Y' | 'AB'): Promise<void> {
    const now = Date.now();
    const last = this.lastButtonPressTime[btn] || 0;
    if (now - last < 200) {
      return; // Debounce rapid clicks
    }
    this.lastButtonPressTime[btn] = now;

    if (btn === 'A') {
      this.state.buttonA = true;
    } else if (btn === 'B') {
      this.state.buttonB = true;
    } else if (btn === 'X') {
      this.state.buttonX = true;
    } else if (btn === 'Y') {
      this.state.buttonY = true;
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
      else if (btn === 'X') this.state.buttonX = false;
      else if (btn === 'Y') this.state.buttonY = false;
      else {
        this.state.buttonA = false;
        this.state.buttonB = false;
      }
      this.notify();
    }, 200);
  }

  public isButtonPressed(btn: 'A' | 'B' | 'X' | 'Y'): boolean {
    switch (btn) {
      case 'A': return this.state.buttonA;
      case 'B': return this.state.buttonB;
      case 'X': return this.state.buttonX;
      case 'Y': return this.state.buttonY;
      default: return false;
    }
  }

  public registerButtonHandler(btn: 'A' | 'B' | 'X' | 'Y' | 'AB', fn: () => Promise<void>): void {
    if (!this.buttonHandlers[btn]) this.buttonHandlers[btn] = [];
    this.buttonHandlers[btn].push(fn);
  }

  // --- RGB LED (WS2812) ---

  public ledSetColor(r: number, g: number, b: number): void {
    this.state.ledColor = {
      r: Math.max(0, Math.min(255, Math.round(r))),
      g: Math.max(0, Math.min(255, Math.round(g))),
      b: Math.max(0, Math.min(255, Math.round(b)))
    };
    this.notify();
  }

  public ledOff(): void {
    this.state.ledColor = { r: 0, g: 0, b: 0 };
    this.notify();
  }

  public ledSetBrightness(val: number): void {
    const num = isNaN(Number(val)) ? 255 : Number(val);
    this.state.ledBrightness = Math.max(0, Math.min(255, Math.round(num)));
    this.notify();
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
    this.buttonHandlers = { A: [], B: [], X: [], Y: [], AB: [] };
    this.state.isRunning = false;
    this.state.buttonA = false;
    this.state.buttonB = false;
    this.state.buttonX = false;
    this.state.buttonY = false;
    this.notify();
  }

  public restart(): void {
    this.stop();
    this.oledClear();
    this.ledOff();
    this.state.ledBrightness = 255;
    this.startTime = Date.now();
    // Trigger workspace execution restart callback if registered
    if (this.onRequestRestart) {
      this.onRequestRestart();
    }
  }

  public prepareNewRun(): AbortSignal {
    this.stop();
    this.oledClear();
    this.ledOff();
    this.state.ledBrightness = 255;
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
