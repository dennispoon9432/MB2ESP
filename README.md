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

- **iPad & Tablet Friendly:**
  - Large touch targets, finger-draggable blocks, and no hover-only requirements.
  - Built-in pairing guide and browser compatibility advisor (Safari/Bluefy for iOS, Chrome/Edge for desktop/Android).

- **Internationalization:**
  - All UI strings localized in `src/i18n/strings.ts` with English and Chinese support.

---

## MicroPython Runtime (`pixl.py`)

The board runs a pre-installed MicroPython library `pixl.py`. The generated code adheres strictly to this specification:

```python
from pixl import *

# on start
display.show_icon(Image.HEART)
display.show_string("Hello MB2ESP")

@on_button("A")
def on_button_a():
    display.show_number(1)

@forever
def forever_loop():
    display.show_icon(Image.HEART)
    pause(500)
    display.show_icon(Image.SMALL_HEART)
    pause(500)

run()  # always the last line
```

---

## Bluetooth Flashing Protocol

- **Service UUID:** `6e400001-b5a3-f393-e0a9-e50e24dcca9e` (Nordic UART Service)
- **RX Characteristic (Write):** `6e400002-b5a3-f393-e0a9-e50e24dcca9e`
- **TX Characteristic (Notify):** `6e400003-b5a3-f393-e0a9-e50e24dcca9e`
- **Packet Protocol:**
  1. `[0x01]` = START packet
  2. `[0x02, ...chunk]` = DATA packet (up to 180 bytes UTF-8 per chunk)
  3. `[0x03]` = END packet
  4. Wait for board response `"OK"` on TX, which commits `main.py` and resets the board.

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
