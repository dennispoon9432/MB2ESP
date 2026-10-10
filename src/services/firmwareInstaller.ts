/**
 * PIXL Firmware Installer Service for MB2ESP (ESP32-S3)
 * Erases, flashes MicroPython via esptool-js, and copies PIXL libraries via raw REPL.
 */

import { ESPLoader, Transport } from 'esptool-js';

export const FIRMWARE_PASSWORD_HASH = '1fc5c3ae5871ebc814209226f7fd05bc5a08faca04644e4a0bb45b4319ed49e3';

export interface FirmwareManifestFile {
  src: string;
  dest: string;
}

export interface FirmwareManifest {
  version: string;
  chip: string;
  firmware: {
    file: string;
    offset: number;
  };
  files: FirmwareManifestFile[];
}

export async function verifyFirmwarePassword(password: string): Promise<boolean> {
  const enc = new TextEncoder().encode(password);
  const hashBuf = await crypto.subtle.digest('SHA-256', enc);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  const hex = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.toLowerCase() === FIRMWARE_PASSWORD_HASH;
}

export function isFirmwareUnlocked(): boolean {
  try {
    return sessionStorage.getItem('pixl_firmware_unlocked') === 'true';
  } catch {
    return false;
  }
}

export function setFirmwareUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      sessionStorage.setItem('pixl_firmware_unlocked', 'true');
    } else {
      sessionStorage.removeItem('pixl_firmware_unlocked');
    }
  } catch {}
}

export async function fetchManifest(): Promise<FirmwareManifest> {
  const base = (import.meta.env.BASE_URL || './').replace(/\/$/, '');
  const url = `${base}/firmware/manifest.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not load firmware manifest from ${url} (${res.status} ${res.statusText})`);
  }
  return await res.json();
}

export async function fetchFirmwareBytes(src: string): Promise<Uint8Array> {
  const base = (import.meta.env.BASE_URL || './').replace(/\/$/, '');
  const url = `${base}/firmware/${src}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not load firmware file ${src} (${res.status} ${res.statusText})`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Step 2 (Automatic): Trigger ROM bootloader over MicroPython REPL using a user-selected port.
 */
export async function triggerBootloader(port: any): Promise<void> {
  await port.open({ baudRate: 115200 });

  try {
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    // Send Ctrl-C twice to interrupt running main.py
    await writer.write(encoder.encode('\r\x03\x03'));
    await new Promise(r => setTimeout(r, 200));
    // Trigger ROM bootloader
    await writer.write(encoder.encode('import machine; machine.bootloader()\r\n'));
    writer.releaseLock();
  } catch {
    // Port disappears into ROM bootloader mode, expected
  }

  try {
    await port.close();
  } catch {}

  // Wait 2 seconds for ROM bootloader enumeration
  await new Promise(r => setTimeout(r, 2000));
}

/**
 * Step 3: Flash MicroPython binary using esptool-js with an already user-selected port.
 */
export async function flashFirmwareBinary(
  port: any,
  manifest: FirmwareManifest,
  onProgress: (percent: number) => void,
  onLog: (msg: string) => void
): Promise<void> {
  onLog(`Fetching MicroPython image: ${manifest.firmware.file}...`);
  const binBytes = await fetchFirmwareBytes(manifest.firmware.file);
  onLog(`Loaded ${binBytes.length} bytes.`);

  onLog('Connecting with ESPLoader...');
  const transport = new Transport(port);

  let esploader = new ESPLoader({
    transport,
    baudrate: 921600,
    romBaudrate: 115200,
    terminal: {
      clean() {},
      writeLine: (s: string) => onLog(s),
      write: (s: string) => onLog(s),
    }
  });

  let chipDesc = '';
  try {
    chipDesc = await esploader.main();
  } catch (err: any) {
    onLog(`High baudrate connection failed (${err.message}). Retrying at 115200 baud...`);
    try {
      await transport.disconnect();
    } catch {}

    const transportFallback = new Transport(port);
    esploader = new ESPLoader({
      transport: transportFallback,
      baudrate: 115200,
      romBaudrate: 115200,
      terminal: {
        clean() {},
        writeLine: (s: string) => onLog(s),
        write: (s: string) => onLog(s),
      }
    });
    chipDesc = await esploader.main();
  }

  const detectedChip = (chipDesc || esploader.chip?.CHIP_NAME || '').toUpperCase();
  onLog(`Detected chip: ${detectedChip || 'Unknown'}`);
  if (!detectedChip.includes('ESP32-S3')) {
    try {
      await transport.disconnect();
    } catch {}
    throw new Error('This board is not an ESP32-S3. PIXL firmware only works on ESP32-S3.');
  }

  onLog('Writing flash with eraseAll: true, compress: true...');
  await esploader.writeFlash({
    fileArray: [{ data: binBytes, address: manifest.firmware.offset || 0 }],
    flashSize: 'keep',
    flashMode: 'keep',
    flashFreq: 'keep',
    eraseAll: true,
    compress: true,
    reportProgress: (_idx, written, total) => {
      const pct = Math.round((written / total) * 100);
      onProgress(pct);
    }
  });

  onLog('Hard resetting board...');
  try {
    await esploader.after('hard_reset');
  } catch (e) {
    onLog(`Reset notice: ${e}`);
  }

  try {
    await transport.disconnect();
  } catch {}

  onLog('Flash step completed successfully.');
}

/**
 * Checks navigator.serial.getPorts() for an already-paired PIXL board (vendor 0x303A, product 0x4001)
 */
export async function tryFindPixlPort(): Promise<any | null> {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) {
    return null;
  }
  try {
    const navSerial = (navigator as any).serial;
    const ports = await navSerial.getPorts();
    for (const p of ports) {
      const info = p.getInfo?.() || {};
      const vid = info.usbVendorId;
      const pid = info.usbProductId;
      // USB vendor 0x303A (12346), product 0x4001 (16385)
      if ((vid === 0x303A || vid === 12346) && (pid === 0x4001 || pid === 16385)) {
        return p;
      }
    }
  } catch {}
  return null;
}

/**
 * Dedicated helper to communicate with MicroPython raw REPL for file copying
 */
export class MicroPythonRawRepl {
  private port: any;
  private reader: any = null;
  private isReading = false;
  private keepReading = false;
  private readBuffer: string = '';

  constructor(port: any) {
    this.port = port;
  }

  public async open(): Promise<void> {
    await this.port.open({ baudRate: 115200 });
    try {
      await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
    } catch {}

    this.keepReading = true;
    this.startReading();
  }

  private async startReading(): Promise<void> {
    if (!this.port.readable || this.isReading) return;
    this.isReading = true;
    const decoder = new TextDecoder('utf-8');

    while (this.port && this.port.readable && this.keepReading) {
      try {
        this.reader = this.port.readable.getReader();
        while (this.keepReading) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value) {
            this.readBuffer += decoder.decode(value);
          }
        }
      } catch {
        break;
      } finally {
        try {
          this.reader?.releaseLock();
        } catch {}
        this.reader = null;
      }
    }
    this.isReading = false;
  }

  public async send(text: string): Promise<void> {
    if (!this.port || !this.port.writable) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  public async waitForOutput(
    predicate: (buf: string) => boolean,
    timeoutMs = 4000,
    timeoutMsg = 'Timeout waiting for board response'
  ): Promise<string> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (predicate(this.readBuffer)) {
        return this.readBuffer;
      }
      await new Promise(r => setTimeout(r, 20));
    }
    throw new Error(timeoutMsg);
  }

  public async enterRawRepl(): Promise<void> {
    // Send \r\x03\x03, wait 200ms
    await this.send('\r\x03\x03');
    await new Promise(r => setTimeout(r, 200));
    this.readBuffer = '';

    // Send \x01, wait for text containing "raw REPL" and ending with ">"
    await this.send('\x01');
    await this.waitForOutput(
      buf => buf.includes('raw REPL') && buf.endsWith('>'),
      4000,
      'No answer. Unplug and replug the board, then try again.'
    );
    this.readBuffer = '';
  }

  public async executeRaw(code: string, timeoutMs = 8000): Promise<string> {
    this.readBuffer = '';
    await this.send(code + '\x04');

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
      timeoutMs,
      `Command execution timed out: ${code.slice(0, 40)}...`
    );

    const okIdx = output.indexOf('OK');
    const afterOk = output.slice(okIdx + 2);
    const firstEot = afterOk.indexOf('\x04');
    const secondEot = afterOk.indexOf('\x04', firstEot + 1);
    const stdout = afterOk.slice(0, firstEot);
    const stderr = afterOk.slice(firstEot + 1, secondEot).trim();

    if (stderr.length > 0) {
      throw new Error(stderr);
    }
    return stdout;
  }

  public async close(): Promise<void> {
    this.keepReading = false;
    if (this.reader) {
      try {
        await Promise.race([this.reader.cancel(), new Promise(r => setTimeout(r, 300))]);
      } catch {}
    }
    try {
      await this.port.close();
    } catch {}
  }
}

/**
 * Step 4: Copy PIXL files over raw REPL on a provided port (no requestPort() called inside).
 */
export async function copyPixlFiles(
  port: any,
  manifest: FirmwareManifest,
  onProgress: (current: number, total: number, fileName: string) => void,
  onLog: (msg: string) => void
): Promise<void> {
  if (!port) {
    throw new Error('No port provided for file copy.');
  }

  onLog('Opening port at 115200 baud...');
  const repl = new MicroPythonRawRepl(port);
  await repl.open();

  try {
    onLog('Entering MicroPython raw REPL...');
    await repl.enterRawRepl();

    onLog('Creating folders: lib, lib/aioble...');
    await repl.executeRaw("import os\ntry:\n os.mkdir('lib')\nexcept OSError:\n pass\n");
    await repl.executeRaw("try:\n os.mkdir('lib/aioble')\nexcept OSError:\n pass\n");

    // Ensure boot.py is written last
    const fileList = [...manifest.files].sort((a, b) => {
      if (a.dest === 'boot.py') return 1;
      if (b.dest === 'boot.py') return -1;
      return 0;
    });

    const total = fileList.length;

    for (let i = 0; i < total; i++) {
      const file = fileList[i];
      onProgress(i + 1, total, file.dest);
      onLog(`Copying file ${i + 1}/${total}: ${file.dest}...`);

      const fileBytes = await fetchFirmwareBytes(file.src);
      const expectedSize = fileBytes.length;

      // Write with one retry attempt if byte length check fails
      let success = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await repl.executeRaw(`f=open('${file.dest}','wb')\nfrom binascii import a2b_base64 as d\n`);

          // Chunk file into 192-byte base64 chunks; batch chunks under ~2KB per command
          const chunkSize = 192;
          let batchCmd = '';
          let batchBytes = 0;

          for (let offset = 0; offset < fileBytes.length; offset += chunkSize) {
            const slice = fileBytes.slice(offset, offset + chunkSize);
            let binStr = '';
            for (let b = 0; b < slice.length; b++) {
              binStr += String.fromCharCode(slice[b]);
            }
            const b64 = btoa(binStr);
            const line = `f.write(d('${b64}'))\n`;
            batchCmd += line;
            batchBytes += line.length;

            if (batchBytes > 1500 || offset + chunkSize >= fileBytes.length) {
              await repl.executeRaw(batchCmd);
              batchCmd = '';
              batchBytes = 0;
            }
          }

          await repl.executeRaw('f.close()\n');

          // Verify size
          const sizeOut = await repl.executeRaw(`print(os.stat('${file.dest}')[6])\n`);
          const writtenSize = parseInt(sizeOut.trim(), 10);

          if (writtenSize === expectedSize) {
            onLog(`Verified ${file.dest}: ${writtenSize} bytes.`);
            success = true;
            break;
          } else {
            onLog(`Size mismatch for ${file.dest}: expected ${expectedSize}, got ${writtenSize}. Retrying...`);
          }
        } catch (fileErr: any) {
          onLog(`Error copying ${file.dest} (attempt ${attempt}): ${fileErr.message}`);
          if (attempt === 2) throw fileErr;
        }
      }

      if (!success) {
        throw new Error(`Failed to copy ${file.dest}: file size verification failed.`);
      }
    }

    onLog('All files copied. Leaving raw REPL and resetting board...');
    await repl.send('\x02');
    await new Promise(r => setTimeout(r, 100));
    await repl.send('import machine; machine.reset()\r\n');
  } finally {
    await repl.close();
  }

  onLog('File copy step completed successfully.');
}
