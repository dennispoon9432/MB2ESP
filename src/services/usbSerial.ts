/**
 * Web Serial Driver for MB2ESP / ESP32-S3
 * Flashes code over MicroPython raw REPL and provides bidirectional Serial Console.
 */

export type USBSerialStatus = 'disconnected' | 'connecting' | 'connected' | 'flashing' | 'error';

export interface USBSerialState {
  status: USBSerialStatus;
  deviceName: string | null;
  progress: number;
  statusMessage: string;
}

type SerialDataListener = (data: string) => void;
type StateChangeListener = (state: USBSerialState) => void;

class USBSerialService {
  private port: any | null = null;
  private reader: any | null = null;
  private isReading = false;
  private keepReading = false;
  private readingPromise: Promise<void> | null = null;
  private isDisconnecting = false;
  private readBuffer: string = '';
  private state: USBSerialState = {
    status: 'disconnected',
    deviceName: null,
    progress: 0,
    statusMessage: 'Ready'
  };

  private serialListeners: Set<SerialDataListener> = new Set();
  private stateListeners: Set<StateChangeListener> = new Set();

  constructor() {
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      try {
        (navigator as any).serial.addEventListener('disconnect', (event: any) => {
          if (this.port && event.port === this.port) {
            console.log('USB device disconnected by physical removal');
            this.disconnect();
          }
        });
      } catch (e) {
        // Event listener might not be supported on all browsers
      }
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public getState(): USBSerialState {
    return { ...this.state };
  }

  public addStateListener(listener: StateChangeListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => this.stateListeners.delete(listener);
  }

  public addSerialListener(listener: SerialDataListener): () => void {
    this.serialListeners.add(listener);
    return () => this.serialListeners.delete(listener);
  }

  private updateState(partial: Partial<USBSerialState>) {
    this.state = { ...this.state, ...partial };
    this.stateListeners.forEach(fn => fn(this.getState()));
  }

  private emitSerial(text: string) {
    this.serialListeners.forEach(fn => fn(text));
  }

  public isConnected(): boolean {
    return this.port !== null && this.state.status === 'connected';
  }

  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('WEB_SERIAL_UNSUPPORTED');
    }

    try {
      this.updateState({ status: 'connecting', statusMessage: 'Selecting USB Serial port...' });
      const navSerial = (navigator as any).serial;
      const port = await navSerial.requestPort();

      // Open at 115200 baud
      await port.open({ baudRate: 115200 });

      // Avoid resetting the ESP32-S3 board
      try {
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      } catch (sigErr) {
        console.warn('setSignals warning:', sigErr);
      }

      this.port = port;
      this.keepReading = true;
      this.readingPromise = this.startReading();

      this.updateState({
        status: 'connected',
        deviceName: 'USB Serial (115200)',
        statusMessage: 'Connected via USB'
      });

      return true;
    } catch (err: any) {
      console.error('USB Serial connection failed:', err);
      if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
        this.updateState({ status: 'disconnected', statusMessage: 'USB connection cancelled' });
        return false;
      }
      this.updateState({ status: 'error', statusMessage: err.message || 'USB Connection failed' });
      throw err;
    }
  }

  private async startReading(): Promise<void> {
    if (!this.port || !this.port.readable || this.isReading) return;
    this.isReading = true;

    try {
      while (this.port && this.port.readable && this.keepReading) {
        try {
          this.reader = this.port.readable.getReader();
        } catch (lockErr) {
          console.warn('Could not acquire reader lock:', lockErr);
          break;
        }

        const decoder = new TextDecoder('utf-8');

        try {
          while (this.keepReading) {
            const { value, done } = await this.reader.read();
            if (done) {
              // Stream ended or cancelled
              break;
            }
            if (value) {
              const text = decoder.decode(value);
              this.readBuffer += text;
              this.emitSerial(text);
            }
          }
        } catch (readErr: any) {
          if (this.keepReading) {
            console.warn('USB read stream error:', readErr);
          }
          break;
        } finally {
          try {
            if (this.reader) {
              this.reader.releaseLock();
            }
          } catch (e) {
            // Lock may already be released
          }
          this.reader = null;
        }

        // Prevent infinite spin if keepReading was set to false
        if (!this.keepReading) {
          break;
        }
      }
    } catch (e) {
      console.warn('USB stream ended:', e);
    } finally {
      this.isReading = false;
      this.keepReading = false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isDisconnecting) return;
    this.isDisconnecting = true;

    try {
      // 1. Signal background loop to terminate immediately
      this.keepReading = false;

      // 2. Cancel active reader so read() promise returns
      if (this.reader) {
        try {
          await Promise.race([
            this.reader.cancel(),
            new Promise(r => setTimeout(r, 400))
          ]);
        } catch (cancelErr) {
          console.warn('USB reader cancel error:', cancelErr);
        }
      }

      // 3. Wait for background reading loop to completely finish and release lock
      if (this.readingPromise) {
        try {
          await Promise.race([
            this.readingPromise,
            new Promise(r => setTimeout(r, 500))
          ]);
        } catch (readPromiseErr) {
          console.warn('USB reading promise error:', readPromiseErr);
        }
        this.readingPromise = null;
      }

      // 4. Force release lock if still held
      if (this.reader) {
        try {
          this.reader.releaseLock();
        } catch (e) {}
        this.reader = null;
      }

      // 5. Close port safely
      if (this.port) {
        try {
          await this.port.close();
        } catch (closeErr) {
          console.warn('USB port close error:', closeErr);
        }
      }
    } catch (e) {
      console.warn('USB disconnect error:', e);
    } finally {
      this.handleDisconnected();
      this.isDisconnecting = false;
    }
  }

  private handleDisconnected() {
    this.port = null;
    this.reader = null;
    this.isReading = false;
    this.keepReading = false;
    this.readingPromise = null;
    this.readBuffer = '';
    this.updateState({
      status: 'disconnected',
      deviceName: null,
      progress: 0,
      statusMessage: 'USB Disconnected'
    });
  }

  public async sendText(text: string): Promise<void> {
    if (!this.port || !this.port.writable) return;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const writer = this.port.writable.getWriter();
      try {
        await writer.write(data);
      } finally {
        writer.releaseLock();
      }
    } catch (e) {
      console.warn('USB sendText error:', e);
    }
  }

  /**
   * Wait until accumulated readBuffer matches condition or timeout
   */
  private async waitForOutput(
    condition: (buf: string) => boolean,
    timeoutMs = 3000,
    timeoutMsg = 'No answer. Unplug and replug the board, then try again.'
  ): Promise<string> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (condition(this.readBuffer)) {
        const result = this.readBuffer;
        return result;
      }
      await new Promise(r => setTimeout(r, 20));
    }
    throw new Error(timeoutMsg);
  }

  /**
   * Flash code over MicroPython raw REPL protocol:
   * a. send "\r\x03\x03" (Ctrl-C twice), wait 200 ms, flush input
   * b. send "\r\x01" (Ctrl-A), wait until received text ends with ">" (contains "raw REPL")
   * c. send code: "f=open('main.py','wb')\nw=f.write\nimport binascii\n" + "\x04"
   *    wait for "OK", then two "\x04" bytes then ">"
   * d. for each 192-byte slice: send "w(binascii.a2b_base64('" + b64 + "'))\n\x04"
   * e. send "f.close()\n\x04"
   * f. send "\x02" (Ctrl-B exit raw REPL), then "\x04" (soft reset)
   */
  public async flashCode(code: string): Promise<void> {
    if (!this.port) {
      const connected = await this.connect();
      if (!connected) throw new Error('USB board not connected');
    }

    this.updateState({ status: 'flashing', progress: 5, statusMessage: 'Connecting to raw REPL...' });

    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(code);
    const totalBytes = utf8Bytes.length;

    try {
      // a. Send Ctrl-C twice to interrupt running program, wait 200ms
      await this.sendText('\r\x03\x03');
      await new Promise(r => setTimeout(r, 200));
      this.readBuffer = '';

      // b. Send Ctrl-A to enter raw REPL, wait for prompt ending with ">"
      await this.sendText('\r\x01');
      await this.waitForOutput(
        buf => buf.endsWith('>') && buf.includes('raw REPL'),
        3000,
        'No answer. Unplug and replug the board, then try again.'
      );
      this.readBuffer = '';

      // Helper function to execute code in raw REPL and check response
      const executeRawCommand = async (pyCmd: string): Promise<void> => {
        this.readBuffer = '';
        await this.sendText(pyCmd + '\x04');

        // Response format: "OK" + stdout + "\x04" + stderr + "\x04" + ">"
        const output = await this.waitForOutput(
          buf => {
            const okIdx = buf.indexOf('OK');
            if (okIdx === -1) return false;
            const afterOk = buf.slice(okIdx + 2);
            const firstEot = afterOk.indexOf('\x04');
            if (firstEot === -1) return false;
            const secondEot = afterOk.indexOf('\x04', firstEot + 1);
            return secondEot !== -1 && buf.endsWith('>');
          },
          4000,
          'Timeout waiting for MicroPython command execution'
        );

        // Check for stderr between the two \x04 bytes
        const okIdx = output.indexOf('OK');
        const afterOk = output.slice(okIdx + 2);
        const firstEot = afterOk.indexOf('\x04');
        const secondEot = afterOk.indexOf('\x04', firstEot + 1);
        const stderr = afterOk.slice(firstEot + 1, secondEot).trim();

        if (stderr.length > 0) {
          throw new Error(stderr);
        }
      };

      // c. Open main.py for binary writing
      this.updateState({ progress: 10, statusMessage: 'Opening main.py on board...' });
      await executeRawCommand("f=open('main.py','wb')\nw=f.write\nimport binascii\n");

      // d. Send in 192-byte chunks encoded in base64
      const sliceSize = 192;
      let offset = 0;

      while (offset < totalBytes) {
        const chunk = utf8Bytes.slice(offset, offset + sliceSize);
        // Convert Uint8Array chunk to base64
        let binaryStr = '';
        for (let i = 0; i < chunk.length; i++) {
          binaryStr += String.fromCharCode(chunk[i]);
        }
        const b64 = btoa(binaryStr);

        await executeRawCommand(`w(binascii.a2b_base64('${b64}'))\n`);

        offset += chunk.length;
        const progress = Math.min(90, Math.round(10 + (offset / totalBytes) * 80));
        this.updateState({
          progress,
          statusMessage: `Flashing via USB: ${offset}/${totalBytes} bytes (${progress}%)`
        });
      }

      // e. Close main.py
      this.updateState({ progress: 95, statusMessage: 'Closing main.py...' });
      await executeRawCommand('f.close()\n');

      // f. Exit raw REPL (Ctrl-B) and soft-reset (Ctrl-D)
      this.updateState({ progress: 98, statusMessage: 'Soft resetting board...' });
      await this.sendText('\x02');
      await new Promise(r => setTimeout(r, 100));
      await this.sendText('\x04');

      this.updateState({
        status: 'connected',
        progress: 100,
        statusMessage: 'Flashed main.py successfully via USB!'
      });
    } catch (err: any) {
      console.error('USB flash error:', err);
      this.updateState({
        status: 'error',
        progress: 0,
        statusMessage: `USB Flash error: ${err.message}`
      });
      // Try to exit raw REPL gracefully
      try {
        await this.sendText('\x02\x04');
      } catch (e) {}
      throw err;
    }
  }
}

export const usbSerialService = new USBSerialService();
