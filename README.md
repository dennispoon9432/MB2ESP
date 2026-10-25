# PIXL / MB2ESP firmware (PIXL board, ESP32-S3)

## Why uploads never erase the firmware
The board's flash has two separate areas:

| Area | Contents | Written by |
|---|---|---|
| Firmware partition | MicroPython itself | esptool, **once**, from a computer |
| File system (littlefs) | `boot.py`, `pixl.py`, `ssd1306.py`, `aioble/`, `main.py` | you once, then the web app |

The web app (Bluetooth **or** USB) only ever replaces `main.py`. MicroPython,
`boot.py` and `pixl.py` are untouched. `boot.py` runs before `main.py` on every
reset, so even a broken program can't lock you out of upload mode.

## PIXL board (EasyEDA project `ESP32_SMD_board`)
ESP32-S3-WROOM-1-N16R8, native USB-C, 0.96" 128x64 SSD1306 panel on a 14-pin
FPC, 4 front buttons, 1 RGB LED, Li-ion cell (TP4054 charger) + power switch.

| Function | GPIO | Notes |
|---|---|---|
| Header H1 (user pins) | 1, 2, 4, 5, 6, 7, 10, 11, 12, 13 | the only GPIOs programs may use (`PINS`) |
| 3-pin sockets | H2 = 1, H4 = 2 (3V3); H6 = 4 (battery voltage, for servos) | |
| I2C: OLED + sockets P1/P2 | SDA 8 / SCL 9 | P1/P2 power = battery voltage |
| OLED reset | 17 | pulsed by `boot.py` and `pixl.py` |
| Button A / B / X / Y | 41 / 42 / 40 / 47 | to GND, internal pull-ups |
| RGB LED (WS2812) | 48 | `led.color(r, g, b)`, `led.off()` |
| BOOT / RST | 0 / EN | on the back |

Programs use the real GPIO numbers, e.g. `pin_write(10, 1)`; any other number
gives a clear error. Every user pin does digital, PWM/servo, I2C/SPI/UART, DHT,
1-Wire, NeoPixel and touch. Analog: 1, 2, 4, 5, 6, 7, 10 always (ADC1);
11, 12, 13 only while Wi-Fi is off (ADC2). Signals are 3.3 V: 5 V sensor
outputs (e.g. HC-SR04 echo) need a divider.

### Prototype (ESP32-S3 DevKit + 4-pin OLED module)
OLED VCC/GND/SDA/SCL to 3V3/GND/GPIO8/GPIO9. BOOT still opens Bluetooth upload
mode; to test buttons A/B/X/Y wire push buttons from GPIO41/42/40/47 to GND.

## One-time setup (computer)
1. Download the **ESP32_GENERIC_S3** firmware (.bin) from micropython.org/download.
   If `esptool flash-id` says "Embedded PSRAM 8MB" (N16R8 DevKit), pick the
   **Octal-SPIRAM** build (`ESP32_GENERIC_S3-SPIRAM_OCT-...bin`), otherwise the
   extra 8 MB RAM is unused. Tested: v1.29.0 SPIRAM_OCT, see `firmware/`.
   After flashing, the board shows up on a new COM port (MicroPython's own USB).
2. Flash it with esptool (or esptool.spacehuhn.com in Chrome):
   `esptool.py --chip esp32s3 erase_flash` then
   `esptool.py --chip esp32s3 write_flash -z 0 ESP32_GENERIC_S3-xxxx.bin`
   (If the port won't connect: hold BOOT, tap RST, release BOOT.)
3. Install the libraries and copy the files (`pip install mpremote`):
   ```
   mpremote mip install aioble
   mpremote mip install ssd1306
   mpremote cp pixl.py :pixl.py
   mpremote cp main.py :main.py
   mpremote cp boot.py :boot.py
   mpremote reset
   ```
   Copy `boot.py` last, so a mistake in it can't block the earlier steps.

## Test checklist
1. **Power on** → screen shows "PIXL v0.3 / ID ... / Press A for BLE upload..."
   for 1.5 s, then the test program: "PIXL test v3", blue LED. Pressing
   A / B / X / Y shows the button name and turns the LED red / green / yellow / purple.
2. **BLE upload** → hold **A** while switching on (or pressing RST), or press A
   during the 1.5 s message. Screen shows the board ID in big letters (e.g.
   `64CC48`, the last 6 hex digits of the chip's factory MAC). The board
   advertises over BLE with exactly that name. In the web app: type the ID,
   click Upload via Bluetooth, click Pair in Chrome's window (it lists only
   that board). Chrome always needs that one click; a website can't skip it.
   Board shows "Upload OK" and restarts straight into the new program.
3. **USB upload** → plug in, click Upload via USB. No buttons needed; the
   running program is interrupted with Ctrl-C.
4. **Lock-out test** → upload a program with an error or an endless loop.
   Upload mode (hold A + reset) must still work.

Exit BLE upload mode without uploading: press RST or switch off and on.

Don't hold BOOT (back of the board) while resetting: that starts the chip's ROM
flasher (blank screen), which only the web app's firmware installer needs.
Just reset again.
