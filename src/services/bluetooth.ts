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
 * 3. Write [0x03, length (uint32 LE), CRC-32 (uint32 LE)] = END (9 bytes)
 * 4. Wait up to 5s for response:
 *    - "OK" = success
 *    - "ERR:..." = retry whole upload up to 3 times
 *    - GATT drop after END treated as success only if no ERR was received
 */

import { crc32 } from './crc32';

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
  
  // Pending flash acknowledgment handlers
  private pendingFlashResponse: {
    resolve: (val: { ok: boolean; error?: string }) => void;
    lastError: string | null;
    isWaiting: boolean;
  } | null = null;

  private justUploadedSuccessfully = false;

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

  public isConnected(): boolean {
    return !!(this.device && this.device.gatt?.connected && this.rxCharacteristic);
  }

  public getConnectedDeviceName(): string | null {
    return this.device?.name || this.state.deviceName || null;
  }

  /**
   * Connect using an already requested BluetoothDevice (from user gesture).
   * Gets service, rx/tx characteristics, and starts notifications.
   */
  public async connectDevice(device: any): Promise<boolean> {
    if (!device) return false;
    this.justUploadedSuccessfully = false;
    this.device = device;
    const devName = device.name || 'PIXL Board';

    device.addEventListener('gattserverdisconnected', () => {
      this.handleDisconnected();
    });

    this.updateState({ status: 'connecting', statusMessage: `Connecting to ${devName}...` });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(NORDIC_UART_SERVICE);

    this.rxCharacteristic = await service.getCharacteristic(NORDIC_UART_RX_CHAR);
    this.txCharacteristic = await service.getCharacteristic(NORDIC_UART_TX_CHAR);

    // Start TX notifications for serial reading and responses
    await this.txCharacteristic.startNotifications();
    this.txCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => {
      this.handleTxNotification(event.target.value);
    });

    this.updateState({
      status: 'connected',
      deviceName: devName,
      statusMessage: `Bluetooth: connected to ${devName}`
    });

    return true;
  }

  /**
   * Synchronous disconnect to drop connection without awaiting promises before requestDevice
   */
  public disconnectSync(): void {
    try {
      if (this.device && this.device.gatt?.connected) {
        this.device.gatt.disconnect();
      }
    } catch (e) {
      console.warn('Sync disconnect warning:', e);
    }
    this.handleDisconnected();
  }

  public async connect(targetBoardId?: string): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('WEB_BLUETOOTH_UNSUPPORTED');
    }

    this.disconnectSync();

    try {
      const cleanId = (targetBoardId || '').trim().toUpperCase();
      const statusMsg = cleanId
        ? `Searching for board ${cleanId}...`
        : 'Searching for PIXL device...';
      this.updateState({ status: 'connecting', statusMessage: statusMsg });

      const navBluetooth = (navigator as any).bluetooth;
      const requestOptions: any = {
        optionalServices: [NORDIC_UART_SERVICE]
      };

      if (cleanId) {
        requestOptions.filters = [{ name: cleanId }];
      } else {
        requestOptions.filters = [{ namePrefix: '' }];
      }

      const device = await navBluetooth.requestDevice(requestOptions);
      return await this.connectDevice(device);
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
    // If we were waiting after sending END, check if it's considered success
    if (this.pendingFlashResponse && this.pendingFlashResponse.isWaiting) {
      if (this.pendingFlashResponse.lastError) {
        this.pendingFlashResponse.resolve({ ok: false, error: this.pendingFlashResponse.lastError });
      } else {
        // Disconnected right after END without error is treated as success (board reset)
        this.pendingFlashResponse.resolve({ ok: true });
      }
      this.pendingFlashResponse = null;
    }

    this.device = null;
    this.rxCharacteristic = null;
    this.txCharacteristic = null;

    if (this.justUploadedSuccessfully) {
      this.justUploadedSuccessfully = false;
      this.updateState({
        status: 'disconnected',
        deviceName: null,
        progress: 0,
        statusMessage: 'Uploaded! The board restarted with your program.'
      });
      return;
    }

    this.updateState({
      status: 'disconnected',
      deviceName: null,
      progress: 0,
      statusMessage: 'Not connected'
    });
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.device && this.device.gatt?.connected) {
        this.device.gatt.disconnect();
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
    const trimmed = text.trim();

    // Check for Flash response
    if (this.pendingFlashResponse && this.pendingFlashResponse.isWaiting) {
      if (trimmed === 'OK') {
        this.pendingFlashResponse.resolve({ ok: true });
        this.pendingFlashResponse = null;
        return;
      }
      if (trimmed.startsWith('ERR:')) {
        this.pendingFlashResponse.lastError = trimmed;
        this.pendingFlashResponse.resolve({ ok: false, error: trimmed });
        this.pendingFlashResponse = null;
        this.emitSerial(text);
        return;
      }
    }

    // Forward all other text to serial console
    this.emitSerial(text);
  }

  private emitSerial(text: string) {
    this.serialListeners.forEach(listener => listener(text));
  }

  /**
   * Flash code to the board using the updated protocol:
   * 1. 0x01 = START
   * 2. 0x02 + up to chunkSize bytes = DATA chunk
   * 3. 0x03 + length (uint32 LE) + CRC-32 (uint32 LE) = END (9 bytes)
   * 4. Wait up to 5 s for "OK". Retries up to 3 times on ERR: (falls back to 100-byte chunks on 2 fails)
   */
  public async flashCode(code: string, preferredChunkSize = 180, targetBoardId?: string): Promise<void> {
    // Flash always writes main.py only
    if (!this.device || !this.device.gatt?.connected || !this.rxCharacteristic) {
      const connected = await this.connect(targetBoardId);
      if (!connected || !this.rxCharacteristic) {
        throw new Error('Board is not connected. Please connect via Bluetooth first.');
      }
    }

    const encoder = new TextEncoder();
    const codeBytes = encoder.encode(code);
    const totalBytes = codeBytes.length;
    const codeCrc = crc32(codeBytes);

    let maxAttempts = 3;
    let attempt = 1;
    let currentChunkSize = preferredChunkSize;

    while (attempt <= maxAttempts) {
      // If failed twice, retry with 100-byte chunks
      if (attempt >= 3) {
        currentChunkSize = 100;
      }

      this.updateState({
        status: 'flashing',
        progress: 5,
        statusMessage: `Flashing main.py (attempt ${attempt}/${maxAttempts}, chunk ${currentChunkSize}B)...`
      });

      try {
        await this.performFlashAttempt(codeBytes, totalBytes, codeCrc, currentChunkSize);
        // Successful flash!
        this.justUploadedSuccessfully = true;
        this.updateState({
          status: 'connected',
          progress: 100,
          statusMessage: 'Uploaded! The board restarted with your program.'
        });
        return;
      } catch (err: any) {
        this.justUploadedSuccessfully = false;
        this.emitSerial(`\n[BLE Flash Warning] Attempt ${attempt} failed: ${err.message}\n`);
        attempt++;
        if (attempt > maxAttempts) {
          this.updateState({
            status: 'error',
            progress: 0,
            statusMessage: `Flash failed after ${maxAttempts} attempts: ${err.message}`
          });
          throw new Error(`Flashing failed after ${maxAttempts} attempts. ${err.message}`);
        }
        // Small pause before retrying
        await new Promise(r => setTimeout(r, 600));
      }
    }
  }

  private async performFlashAttempt(
    codeBytes: Uint8Array,
    totalBytes: number,
    codeCrc: number,
    chunkSize: number
  ): Promise<void> {
    if (!this.rxCharacteristic) {
      throw new Error('Bluetooth connection lost');
    }

    // 1. Send START packet [0x01]
    const startPacket = new Uint8Array([0x01]);
    await this.writePacket(startPacket);
    this.updateState({ progress: 10, statusMessage: 'Handshake accepted...' });

    // 2. Send DATA chunks [0x02, ...chunk]
    let offset = 0;
    while (offset < totalBytes) {
      const chunkLength = Math.min(chunkSize, totalBytes - offset);
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

    // 3. Prepare 9-byte END packet: [0x03, length uint32 LE, CRC32 uint32 LE]
    const endPacket = new Uint8Array(9);
    endPacket[0] = 0x03;
    const view = new DataView(endPacket.buffer);
    view.setUint32(1, totalBytes, true); // uint32 little-endian length
    view.setUint32(5, codeCrc, true);    // uint32 little-endian CRC-32

    this.updateState({ progress: 95, statusMessage: 'Verifying CRC-32 on board...' });

    // 4. Send END and wait up to 5s for confirmation
    const responsePromise = new Promise<{ ok: boolean; error?: string }>((resolve, reject) => {
      this.pendingFlashResponse = {
        resolve,
        lastError: null,
        isWaiting: true
      };

      const timer = setTimeout(() => {
        if (this.pendingFlashResponse?.isWaiting) {
          // Timeout reached
          const lastErr = this.pendingFlashResponse.lastError;
          this.pendingFlashResponse = null;
          if (lastErr) {
            reject(new Error(lastErr));
          } else {
            // If timed out without error and board disconnected, consider success
            resolve({ ok: true });
          }
        }
      }, 5000);
    });

    await this.writePacket(endPacket);

    const result = await responsePromise;
    if (!result.ok) {
      throw new Error(result.error || 'Board returned an error');
    }
  }

  private async writePacket(packet: Uint8Array): Promise<void> {
    if (!this.rxCharacteristic) {
      throw new Error('Bluetooth RX characteristic unavailable');
    }

    if (typeof this.rxCharacteristic.writeValueWithResponse === 'function') {
      await this.rxCharacteristic.writeValueWithResponse(packet);
    } else {
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
