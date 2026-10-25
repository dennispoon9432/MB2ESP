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
  private isRestarting = false;
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
          if (this.isRestarting) {
            // Expected disconnection during board reboot; do not treat as error or interrupt restart flow
            return;
          }
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

  /**
   * Open an existing USB port (obtained from navigator.serial.requestPort)
   */
  public async openPort(port: any): Promise<boolean> {
    try {
      this.updateState({ status: 'connecting', statusMessage: 'Opening USB Serial port...' });
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
        statusMessage: 'USB: connected'
      });

      return true;
    } catch (err: any) {
      console.error('USB Serial open failed:', err);
      this.updateState({ status: 'error', statusMessage: err.message || 'USB Open failed' });
      throw err;
    }
  }

  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('WEB_SERIAL_UNSUPPORTED');
    }

    try {
      this.updateState({ status: 'connecting', statusMessage: 'Selecting USB Serial port...' });
      const navSerial = (navigator as any).serial;
      const port = await navSerial.requestPort({
        filters: [{ usbVendorId: 0x303A }]
      });

      return await this.openPort(port);
    } catch (err: any) {
      console.error('USB Serial connection failed:', err);
      if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
        this.updateState({ status: 'disconnected', statusMessage: 'Not connected. Is the board switched on?' });
        return false;
      }
      this.updateState({ status: 'error', statusMessage: (err.message || 'USB Connection failed') + '. Is the board switched on?' });
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

  /**
   * Quietly close the existing port and streams during a planned board restart
   * without emitting errors or user warnings.
   */
  public async quietClose(): Promise<void> {
    this.keepReading = false;
    if (this.reader) {
      try {
        await Promise.race([
          this.reader.cancel(),
          new Promise(r => setTimeout(r, 200))
        ]);
      } catch (e) {}
      try {
        this.reader.releaseLock();
      } catch (e) {}
      this.reader = null;
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch (e) {}
      this.port = null;
    }
    this.isReading = false;
    this.readingPromise = null;
    this.readBuffer = '';
  }

  /**
   * Reconnect automatically after board restart:
   * Listen for navigator.serial "connect" events and/or check navigator.serial.getPorts()
   * every 500 ms for up to 8 seconds for a port with usbVendorId 0x303A and usbProductId 0x4001,
   * then open it again at 115200 so the serial monitor keeps showing print() output.
   */
  public async autoReconnectAfterReset(maxWaitMs = 8000): Promise<boolean> {
    if (!this.isSupported()) {
      this.isRestarting = false;
      return false;
    }

    const navSerial = (navigator as any).serial;
    const startTime = Date.now();

    return new Promise<boolean>((resolve) => {
      let resolved = false;
      let intervalId: any = null;

      const cleanup = () => {
        if (intervalId) clearInterval(intervalId);
        try {
          navSerial.removeEventListener('connect', onConnect);
        } catch (e) {}
      };

      const tryOpen = async (targetPort: any): Promise<boolean> => {
        try {
          const info = targetPort.getInfo ? targetPort.getInfo() : {};
          const isS3 =
            info.usbVendorId === 0x303A &&
            (info.usbProductId === 0x4001 || !info.usbProductId);

          if (!isS3 && info.usbVendorId !== 0x303A) {
            return false;
          }

          // Open the port at 115200 baud
          await this.openPort(targetPort);
          if (!resolved) {
            resolved = true;
            this.isRestarting = false;
            cleanup();
            this.updateState({
              status: 'connected',
              deviceName: 'USB Serial (115200)',
              statusMessage: 'USB: connected'
            });
            resolve(true);
          }
          return true;
        } catch (err) {
          // Port may still be initializing by the OS, will retry next tick
          return false;
        }
      };

      const onConnect = async (event: any) => {
        if (resolved) return;
        const p = event?.port;
        if (p) {
          await tryOpen(p);
        }
      };

      try {
        navSerial.addEventListener('connect', onConnect);
      } catch (e) {}

      // Polling every 500 ms for up to 8 seconds
      intervalId = setInterval(async () => {
        if (resolved) {
          cleanup();
          return;
        }

        if (Date.now() - startTime > maxWaitMs) {
          resolved = true;
          cleanup();
          this.isRestarting = false;
          this.updateState({
            status: 'disconnected',
            deviceName: null,
            statusMessage: 'USB: not connected'
          });
          resolve(false);
          return;
        }

        try {
          const ports = await navSerial.getPorts();
          for (const p of ports) {
            if (await tryOpen(p)) {
              return;
            }
          }
        } catch (e) {}
      }, 500);
    });
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

      // f. Full restart of the board instead of soft reset (Ctrl-D)
      this.updateState({ progress: 98, statusMessage: 'Restarting board...' });
      this.isRestarting = true;

      // Still in raw REPL, execute full restart with JUSTFLASHED flag so boot.py starts new program straight away
      const restartScript = 'import machine\nmachine.RTC().memory(b"JUSTFLASHED")\nmachine.reset()\n\x04';
      try {
        await this.sendText(restartScript);
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        // Hardware reset drops USB immediately, which is normal and expected
      }

      // Close the reader/writer and port quietly without reporting error
      await this.quietClose();

      this.updateState({
        status: 'connected',
        progress: 100,
        statusMessage: 'Uploaded! The board restarted with your program.'
      });

      // Automatically reconnect so serial monitor keeps showing print() output
      this.autoReconnectAfterReset(8000).catch(reconnectErr => {
        console.warn('USB auto-reconnect warning:', reconnectErr);
      });
    } catch (err: any) {
      if (this.isRestarting) {
        return;
      }
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
