# MB2ESP Code Studio

A static, client-side, block-based and Python coding studio for the **MB2ESP** educational microcontroller board.

Designed with an intuitive, touch-friendly interface following the familiar block-coding layout, MB2ESP Code Studio runs completely client-side in the browser and requires no backend server or cloud API keys.

---

## Features

- **Intuitive Block & Python Interface:**
  - **Home Screen:** Create new projects, manage saved projects (stored locally in `localStorage`), rename, duplicate, export, and import `.pixl` files.
  - **Blocks | Python Toggle:** Switch seamlessly between graphical blocks and MicroPython code.
  - **Google Blockly Workspace:** Custom color-coded blocks for Basic, Input, Display/OLED, Pins, Loops, Logic, Variables, Math, and Extensions.
  - **Interactive 5x5 LED Matrix Field:** Click and toggle LED pixels directly inside the `show leds` block.
  - **Monaco Code Editor:** Python mode with syntax highlighting, read-only preview by default, and conversion warning before unlocking direct code editing.

- **Real-Time Hardware Simulator:**
  - Realistic MB2ESP board graphic with tactile Button A, Button B, and A+B.
  - Interactive 128x64 OLED display supporting both 5x5 virtual LED grid mode and direct graphics/text drawing (`oled.text`, `oled.line`, `oled.rect`).
  - Live GPIO Pin monitor for P0 through P8 showing digital levels and servo angles.
  - Instant re-simulation when blocks or code change.

- **Web Bluetooth Flashing (Nordic UART Service):**
  - Connect directly to the board over BLE (`PIXL-XXXX`).
  - Sequentially transmits MicroPython code using the hardware protocol with configurable chunk sizes.
  - Auto-prepends extension libraries into `main.py`.
  - Live serial console with real-time feedback and UART message sender.

- **Extensibility:**
  - Built-in extensions for **NeoPixel (WS2812)** and **Servo Motors**.
  - Dynamic GitHub extension loader: import custom drivers and blocks from any GitHub repo with `blocks.json` and `ext.py`.
  - **Hardware Rule:** Extensions that touch hardware pins must call `pin_gpio(P-number)` to get the physical ESP32-S3 GPIO pin.

- **iPad & Tablet Friendly:**
  - Large touch targets, finger-draggable blocks, and no hover-only requirements.
  - Built-in pairing guide and browser compatibility advisor (Safari/Bluefy for iOS, Chrome/Edge for desktop/Android).

- **Internationalization:**
  - All UI strings localized in `src/i18n/strings.ts` with English and Chinese support.

---

## Real GPIO Pin Mapping (ESP32-S3)

Pins are named by the real physical GPIO numbers printed on the board, and the generated MicroPython uses that same number directly (e.g. `pin_write(10, 1)`, `analog_read(4)`, `servo(15, 90)`).

The board has exactly 12 usable GPIO pins:

| Pin Label | GPIO Number | Analog Read (ADC) | Description |
|---|---|---|---|
| **GPIO1** | 1 | Always | Digital I/O, PWM, Servo, ADC |
| **GPIO2** | 2 | Always | Digital I/O, PWM, Servo, ADC |
| **GPIO4** | 4 | Always | Digital I/O, PWM, Servo, ADC |
| **GPIO5** | 5 | Always | Digital I/O, PWM, Servo, ADC |
| **GPIO6** | 6 | Always | Digital I/O, PWM, Servo, ADC |
| **GPIO7** | 7 | Always | Digital I/O, PWM, Servo, ADC |
| **GPIO10** | 10 | Always | Digital I/O, PWM, Servo, ADC |
| **GPIO11** | 11 | Disabled when Wi-Fi active | Digital I/O, PWM, Servo, ADC (Wi-Fi shared) |
| **GPIO12** | 12 | Disabled when Wi-Fi active | Digital I/O, PWM, Servo, ADC (Wi-Fi shared) |
| **GPIO15** | 15 | Disabled when Wi-Fi active | Digital I/O, PWM, Servo, ADC (Wi-Fi shared) |
| **GPIO16** | 16 | Disabled when Wi-Fi active | Digital I/O, PWM, Servo, ADC (Wi-Fi shared) |
| **GPIO17** | 17 | Disabled when Wi-Fi active | Digital I/O, PWM, Servo, ADC (Wi-Fi shared) |
| **OLED SDA** | 8 | - | Shared I2C Data (never in pin dropdowns) |
| **OLED SCL** | 9 | - | Shared I2C Clock (never in pin dropdowns) |

> **Legacy Project Migration:** Existing saved projects that used P0–P8 are automatically migrated when loaded:
> P0→1, P1→2, P2→4, P3→5, P4→6, P5→7, P6→15, P7→16, P8→17.

---

## Install PIXL Firmware Tool (USB, Web Serial)

Located in **Settings** > **Board Firmware Tool**, this password-protected wizard allows teachers and engineers to turn a blank ESP32-S3 board (or an Arduino board) into a ready-to-use PIXL board directly from the browser:
- **Password Gate:** Verifies password via SHA-256 (`crypto.subtle.digest`) with zero plain passwords stored in source code.
- **Bootloader Setup:** Supports both automatic reboot from existing MicroPython (`machine.bootloader()`) and manual BOOT/RST button sequence.
- **Flashes MicroPython:** Uses Espressif's `esptool-js` to erase flash and write `micropython.bin` at offset 0.
- **Copies PIXL Libraries:** Automatically formats and copies system files (`pixl.py`, `boot.py`, `main.py`, SSD1306, and aioble) over MicroPython raw REPL with chunked base64 writing and byte-level size verification.

---

## Bluetooth BLE Flashing Protocol

- **Service UUID:** `6e400001-b5a3-f393-e0a9-e50e24dcca9e` (Nordic UART Service)
- **RX Characteristic (Write):** `6e400002-b5a3-f393-e0a9-e50e24dcca9e`
- **TX Characteristic (Notify):** `6e400003-b5a3-f393-e0a9-e50e24dcca9e`
- **Packet Protocol:**
  1. `[0x01]` = START packet
  2. `[0x02, ...chunk]` = DATA packet (default 180 bytes UTF-8 per chunk)
  3. `[0x03, length (uint32 LE), CRC-32 (uint32 LE)]` = END packet (9 bytes total).
     - `length`: total UTF-8 byte length of `main.py`
     - `CRC-32`: standard IEEE 802.3 / zlib CRC-32 checksum
  4. Wait up to 5 seconds for TX notification:
     - `"OK"` = success. Board commits `main.py` and resets.
     - `"ERR:..."` = failure; automatically retries the entire transfer up to 3 times (falling back to 100-byte chunks on 2 failures).
     - If GATT connection drops after END before `"OK"`, treated as success if no `"ERR:"` was received.
- **Safety Rule:** Never writes `boot.py` or `pixl.py`; Flash always writes `main.py` only.

---

## USB Web Serial Flashing Protocol (Desktop Chrome & Edge)

- Connects at **115200 baud** using Web Serial API (`navigator.serial.requestPort()`).
- Sets `dataTerminalReady: false, requestToSend: false` on connect to prevent resetting the ESP32-S3.
- Flashes directly into `main.py` via MicroPython Raw REPL:
  1. Sends `"\r\x03\x03"` (Ctrl-C x2) to interrupt, waits 200 ms.
  2. Sends `"\r\x01"` (Ctrl-A) to enter raw REPL, waits for `">"`.
  3. Sends `f=open('main.py','wb')\nw=f.write\nimport binascii\n\x04` and verifies `OK`.
  4. Streams base64 encoded slices (192 bytes each): `w(binascii.a2b_base64('...'))\n\x04`.
  5. Closes file with `f.close()\n\x04`.
  6. Sends `"\x02"` (Ctrl-B exit raw REPL) and `"\x04"` (Ctrl-D soft reset) to run `main.py`.
- Keeps port open after flashing for interactive Serial Console / REPL communications.

---

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm

### Installation

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Build for Production

```bash
npm run build
```

This compiles a static build to the `dist/` directory with relative asset paths (`base: './'`).

### Deploy to GitHub Pages

The repository includes an automated GitHub Actions workflow in `.github/workflows/deploy.yml`.

To deploy:
1. Push this repository to GitHub on the `main` branch.
2. In your GitHub repository settings, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, choose **GitHub Actions**.
4. Pushing commits to `main` will automatically build and deploy the app to GitHub Pages.
