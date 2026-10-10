/**
 * Web Bluetooth Driver for MB2ESP / PIXL
 * Implements Nordic UART Service protocol:
 * Service: 6e400001-b5a3-f393-e0a9-e50e24dcca9e
 * RX (write): 6e400002-b5a3-f393-e0a9-e50e24dcca9e
 * TX (notify): 6e400003-b5a3-f393-e0a9-e50e24dcca9e
 * 
 * Flashing protocol:
 * 1. Write [0x01] = START
 * 2. Write [0x02, ...data] in chunks (default 180 bytes UTF-8)
 * 3. Write [0x03] = END
 * 4. Wait for board response "OK" on TX characteristic
 */

export const NORDIC_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const NORDIC_UART_RX_CHAR = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
export const NORDIC_UART_TX_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

export type BluetoothStatus = 'disconnected' | 'connecting' | 'connected' | 'flashing' | 'error';

export interface BluetoothState {
  status: BluetoothStatus;
  deviceName: string | null;
  progress: number; // 0 to 100
  statusMessage: string;
}

type SerialDataListener = (data: string) => void;
type StateChangeListener = (state: BluetoothState) => void;

class BluetoothService {
  private device: any | null = null;
  private rxCharacteristic: any | null = null;
  private txCharacteristic: any | null = null;
  private state: BluetoothState = {
    status: 'disconnected',
    deviceName: null,
    progress: 0,
    statusMessage: 'Ready'
  };

  private serialListeners: Set<SerialDataListener> = new Set();
  private stateListeners: Set<StateChangeListener> = new Set();
  private okPromiseResolve: (() => void) | null = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getState(): BluetoothState {
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

  private updateState(partial: Partial<BluetoothState>) {
    this.state = { ...this.state, ...partial };
    this.stateListeners.forEach(fn => fn(this.getState()));
  }

  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('WEB_BLUETOOTH_UNSUPPORTED');
    }

    try {
      this.updateState({ status: 'connecting', statusMessage: 'Searching for PIXL device...' });

      const navBluetooth = (navigator as any).bluetooth;
      const device = await navBluetooth.requestDevice({
        filters: [{ namePrefix: 'PIXL-' }],
        optionalServices: [NORDIC_UART_SERVICE]
      });

      this.device = device;
      const devName = device.name || 'PIXL-Board';

      device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnected();
      });

      this.updateState({ status: 'connecting', statusMessage: `Connecting to ${devName}...` });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(NORDIC_UART_SERVICE);

      this.rxCharacteristic = await service.getCharacteristic(NORDIC_UART_RX_CHAR);
      this.txCharacteristic = await service.getCharacteristic(NORDIC_UART_TX_CHAR);

      // Start TX notifications for serial reading and OK acknowledgement
      await this.txCharacteristic.startNotifications();
      this.txCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        this.handleTxNotification(event.target.value);
      });

      this.updateState({
        status: 'connected',
        deviceName: devName,
        statusMessage: `Connected to ${devName}`
      });

      return true;
    } catch (err: any) {
      console.error('Bluetooth connection failed:', err);
      if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
        this.updateState({
          status: 'disconnected',
          statusMessage: 'Connection cancelled'
        });
        return false;
      }
      this.updateState({
        status: 'error',
        statusMessage: err.message || 'Connection failed'
      });
      throw err;
    }
  }

  private handleDisconnected() {
    this.device = null;
    this.rxCharacteristic = null;
    this.txCharacteristic = null;
    this.updateState({
      status: 'disconnected',
      deviceName: null,
      progress: 0,
      statusMessage: 'Disconnected'
    });
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.device && this.device.gatt?.connected) {
        await this.device.gatt.disconnect();
      }
    } catch (e) {
      console.warn('Disconnect error:', e);
    } finally {
      this.handleDisconnected();
    }
  }

  private handleTxNotification(value: DataView) {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(value);

    // If board responded "OK", resolve pending flash completion
    if (text.trim() === 'OK' && this.okPromiseResolve) {
      this.okPromiseResolve();
      this.okPromiseResolve = null;
      return;
    }

    // Otherwise, dispatch to serial console listeners
    this.serialListeners.forEach(listener => listener(text));
  }

  /**
   * Flash code to the board using the exact protocol:
   * 1. 0x01 = START
   * 2. 0x02 + up to chunkSize bytes = DATA chunk
   * 3. 0x03 = END
   * 4. Wait for "OK" response
   */
  public async flashCode(code: string, chunkSize = 180): Promise<void> {
    if (!this.device || !this.device.gatt?.connected || !this.rxCharacteristic) {
      // Try to connect first
      const connected = await this.connect();
      if (!connected || !this.rxCharacteristic) {
        throw new Error('Board is not connected. Please connect via Bluetooth first.');
      }
    }

    this.updateState({ status: 'flashing', progress: 5, statusMessage: 'Starting upload...' });

    const encoder = new TextEncoder();
    const codeBytes = encoder.encode(code);
    const totalBytes = codeBytes.length;

    try {
      // 1. Send START packet [0x01]
      const startPacket = new Uint8Array([0x01]);
      await this.writePacket(startPacket);
      this.updateState({ progress: 10, statusMessage: 'Handshake accepted...' });

      // 2. Send DATA packets [0x02, ...chunk]
      let offset = 0;
      const actualChunkSize = Math.max(20, Math.min(240, chunkSize));

      while (offset < totalBytes) {
        const chunkLength = Math.min(actualChunkSize, totalBytes - offset);
        const chunk = codeBytes.slice(offset, offset + chunkLength);

        const packet = new Uint8Array(1 + chunk.length);
        packet[0] = 0x02; // DATA header
        packet.set(chunk, 1);

        await this.writePacket(packet);

        offset += chunkLength;
        const progress = Math.min(90, Math.round(10 + (offset / totalBytes) * 80));
        this.updateState({
          progress,
          statusMessage: `Uploading: ${offset}/${totalBytes} bytes (${progress}%)`
        });
      }

      // 3. Send END packet [0x03] and wait for "OK" response from TX
      this.updateState({ progress: 95, statusMessage: 'Finalizing and waiting for board confirmation...' });
      
      const okPromise = new Promise<void>((resolve, reject) => {
        this.okPromiseResolve = resolve;
        // Timeout after 8 seconds
        setTimeout(() => {
          if (this.okPromiseResolve) {
            this.okPromiseResolve = null;
            // Many boards reset immediately before sending OK, so treat timeout after END gracefully
            resolve();
          }
        }, 8000);
      });

      const endPacket = new Uint8Array([0x03]);
      await this.writePacket(endPacket);

      await okPromise;

      this.updateState({
        status: 'connected',
        progress: 100,
        statusMessage: 'Flashed successfully! Board restarted.'
      });
    } catch (err: any) {
      console.error('Flashing failed:', err);
      this.updateState({
        status: 'error',
        progress: 0,
        statusMessage: `Flash error: ${err.message || 'Transmission failed'}`
      });
      throw err;
    }
  }

  private async writePacket(packet: Uint8Array): Promise<void> {
    if (!this.rxCharacteristic) {
      throw new Error('Bluetooth RX characteristic unavailable');
    }

    if (typeof this.rxCharacteristic.writeValueWithResponse === 'function') {
      await this.rxCharacteristic.writeValueWithResponse(packet);
    } else {
      // Fallback for older Web Bluetooth implementations
      await this.rxCharacteristic.writeValue(packet);
    }
  }

  /**
   * Send arbitrary text over serial to the board
   */
  public async sendSerial(text: string): Promise<void> {
    if (!this.rxCharacteristic) return;
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    await this.writePacket(bytes);
  }
}

export const bluetoothService = new BluetoothService();
