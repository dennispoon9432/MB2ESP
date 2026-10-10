/**
 * MB2ESP Virtual Hardware Simulator
 * Simulates:
 * - 128x64 OLED display
 * - 5x5 Matrix LED overlay mode centered on OLED
 * - Button A, Button B, and Button A+B events
 * - Pins P0 to P8 (digital, analog, servo)
 * - Serial output
 */

import { ICON_MAP } from '../blockly/blocks';

export interface SimulatorPinState {
  digital: number; // 0 or 1
  analog: number; // 0 to 1023
  servoAngle: number | null; // 0 to 180
}

export interface SimulatorState {
  displayMode: '5x5' | 'oled';
  ledMatrix: number[][]; // 5x5 (0 or 1)
  buttonA: boolean;
  buttonB: boolean;
  runningTime: number;
  pins: Record<number, SimulatorPinState>;
  isRunning: boolean;
  scrollingText: string | null;
}

export type SimulatorLogListener = (msg: string) => void;

export class MB2ESPSimulator {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
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

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): SimulatorState {
    const pins: Record<number, SimulatorPinState> = {};
    for (let i = 0; i <= 8; i++) {
      pins[i] = { digital: 0, analog: 0, servoAngle: null };
    }
    return {
      displayMode: '5x5',
      ledMatrix: Array(5).fill(0).map(() => Array(5).fill(0)),
      buttonA: false,
      buttonB: false,
      runningTime: 0,
      pins,
      isRunning: false,
      scrollingText: null
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

  // --- Display APIs ---

  public clear(): void {
    this.state.displayMode = '5x5';
    this.state.ledMatrix = Array(5).fill(0).map(() => Array(5).fill(0));
    this.state.scrollingText = null;
    if (this.ctx && this.canvas) {
      this.ctx.fillStyle = '#060B10';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.notify();
  }

  public showIcon(iconName: string): void {
    const pattern = ICON_MAP[iconName] || ICON_MAP['HEART'];
    this.showLeds(pattern);
  }

  public showLeds(pattern: string): void {
    this.state.displayMode = '5x5';
    this.state.scrollingText = null;
    const rows = pattern.split(':');
    const newMatrix = Array(5).fill(0).map(() => Array(5).fill(0));
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        newMatrix[r][c] = rows[r]?.[c] === '1' ? 1 : 0;
      }
    }
    this.state.ledMatrix = newMatrix;
    this.notify();
  }

  public showNumber(n: number): void {
    this.showString(String(n));
  }

  public async showString(s: string): Promise<void> {
    this.emitLog(`[MB2ESP OLED] ${s}\n`);
    this.state.scrollingText = s;
    this.state.displayMode = '5x5';

    // Simple 3x5 font representation for numbers/letters or OLED render
    if (this.ctx && this.canvas) {
      this.ctx.fillStyle = '#060B10';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#00E5FF';
      this.ctx.font = 'bold 16px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(s, this.canvas.width / 2, this.canvas.height / 2);
    }
    this.notify();
    await this.pause(600);
  }

  public plot(x: number, y: number): void {
    if (x >= 0 && x < 5 && y >= 0 && y < 5) {
      this.state.displayMode = '5x5';
      this.state.ledMatrix[y][x] = 1;
      this.notify();
    }
  }

  public unplot(x: number, y: number): void {
    if (x >= 0 && x < 5 && y >= 0 && y < 5) {
      this.state.displayMode = '5x5';
      this.state.ledMatrix[y][x] = 0;
      this.notify();
    }
  }

  // OLED Graphic primitives (128x64)
  public oledClear(): void {
    this.state.displayMode = 'oled';
    if (this.ctx && this.canvas) {
      this.ctx.fillStyle = '#060B10';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.notify();
  }

  public oledText(text: string, x: number, y: number): void {
    this.state.displayMode = 'oled';
    if (this.ctx && this.canvas) {
      this.ctx.fillStyle = '#00E5FF';
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(text, x, y);
    }
    this.notify();
  }

  public oledLine(x1: number, y1: number, x2: number, y2: number): void {
    this.state.displayMode = 'oled';
    if (this.ctx) {
      this.ctx.strokeStyle = '#00E5FF';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
    this.notify();
  }

  public oledRect(x: number, y: number, w: number, h: number): void {
    this.state.displayMode = 'oled';
    if (this.ctx) {
      this.ctx.strokeStyle = '#00E5FF';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, w, h);
    }
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

    // Release after 250ms
    setTimeout(() => {
      if (btn === 'A') this.state.buttonA = false;
      else if (btn === 'B') this.state.buttonB = false;
      else {
        this.state.buttonA = false;
        this.state.buttonB = false;
      }
      this.notify();
    }, 250);
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
    if (this.state.pins[pin]) {
      this.state.pins[pin].digital = val ? 1 : 0;
      this.notify();
    }
  }

  public pinRead(pin: number): number {
    return this.state.pins[pin]?.digital ?? 0;
  }

  public analogRead(pin: number): number {
    return this.state.pins[pin]?.analog ?? 0;
  }

  public servo(pin: number, angle: number): void {
    if (this.state.pins[pin]) {
      this.state.pins[pin].servoAngle = Math.max(0, Math.min(180, angle));
      this.notify();
    }
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

  public restart(): void {
    this.stop();
    this.clear();
    this.startTime = Date.now();
    this.abortController = new AbortController();
    this.state.isRunning = true;
    this.notify();
  }

  public getAbortSignal(): AbortSignal | null {
    return this.abortController?.signal || null;
  }

  // --- Canvas Renderer for 128x64 OLED ---

  public render(): void {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    if (this.state.displayMode === '5x5') {
      // Background OLED
      ctx.fillStyle = '#070D14';
      ctx.fillRect(0, 0, width, height);

      // Subtle OLED scanline texture
      ctx.fillStyle = 'rgba(0, 229, 255, 0.03)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      // Draw 5x5 LED matrix centered on the OLED display
      const matrix = this.state.ledMatrix;
      const ledSize = 8;
      const gap = 3;
      const totalW = 5 * ledSize + 4 * gap;
      const totalH = 5 * ledSize + 4 * gap;
      const startX = Math.floor((width - totalW) / 2);
      const startY = Math.floor((height - totalH) / 2);

      // Centered dark background panel
      ctx.fillStyle = '#0B1520';
      ctx.beginPath();
      ctx.roundRect(startX - 5, startY - 5, totalW + 10, totalH + 10, 4);
      ctx.fill();
      ctx.strokeStyle = '#16283D';
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const isLit = matrix[r][c] === 1;
          const x = startX + c * (ledSize + gap);
          const y = startY + r * (ledSize + gap);

          if (isLit) {
            // Glow effect
            ctx.shadowColor = '#FF2222';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#FF3333';
            ctx.fillRect(x, y, ledSize, ledSize);

            // Center highlight
            ctx.fillStyle = '#FFAAAA';
            ctx.fillRect(x + 2, y + 2, ledSize - 4, ledSize - 4);
            ctx.shadowBlur = 0;
          } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#16222F';
            ctx.fillRect(x, y, ledSize, ledSize);
          }
        }
      }
    }
  }
}
