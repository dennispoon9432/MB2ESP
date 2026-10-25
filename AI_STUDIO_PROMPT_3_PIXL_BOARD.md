Please update the PIXL / MB2ESP web app for the new PIXL board (our own PCB). The board firmware (`pixl.py`, `boot.py`) is already updated. Keep the upload protocols (Bluetooth packets + CRC, USB raw REPL), the Board ID field, the firmware installer flow, and "every program ends with `run()`" unchanged.

## 1. Pins: now 10 pins

The board has exactly these user pins, in this order:
**GPIO 1, 2, 4, 5, 6, 7, 10, 11, 12, 13**

- Every pin dropdown (digital write/read, analog write/read, servo, and any extension that takes a pin) offers exactly these 10, labelled "GPIO1" … "GPIO13". Generated code uses the plain number, as now (e.g. `pin_write(13, 1)`).
- Remove GPIO15, GPIO16 and GPIO17 everywhere (GPIO17 is now used inside the board). Add GPIO13.
- Analog read hint: GPIO 1, 2, 4, 5, 6, 7, 10 always work; GPIO 11, 12, 13 do not work while Wi-Fi is on.
- Servo hint: "Plug servos into the 3-pin socket on GPIO4: it has battery power for the motor."
- Saved projects that still use GPIO15/16/17: load them, but put a warning on those blocks ("This pin doesn't exist on the PIXL board, choose another one") instead of failing.

## 2. Buttons: A, B, X, Y

The board has 4 front buttons around the screen: **A** top-left, **B** top-right, **X** bottom-left, **Y** bottom-right.

- "on button [ ] pressed" offers A, B, X, Y and "A + B". It generates `@on_button("A")`, `@on_button("B")`, `@on_button("X")`, `@on_button("Y")`, `@on_button("AB")` (same pattern as now; function names like `on_button_x`).
- "button [ ] is pressed" offers A, B, X, Y and generates `button_a.is_pressed()`, `button_b.is_pressed()`, `button_x.is_pressed()`, `button_y.is_pressed()`.

## 3. New blocks: RGB LED

The board has one RGB LED. Add a "LED" category (or put them in the existing output/display category) with these blocks:

| Block | Generated code |
|---|---|
| set LED color [colour picker] | `led.color(R, G, B)` with the picker's hex colour converted to three numbers 0–255, e.g. `#ff8800` → `led.color(255, 136, 0)` |
| set LED red [n] green [n] blue [n] | `led.color(r, g, b)` (number inputs, 0–255) |
| turn LED off | `led.off()` |

In Python mode these functions are available as `led.color(r, g, b)` and `led.off()`.

## 4. Screen

Still a 128x64 OLED; no change to the screen blocks or the simulator size.

## 5. Board picture / simulator / help texts

- If the app shows a board picture or simulator: a square board with the screen in the middle, buttons A (top-left), B (top-right), X (bottom-left), Y (bottom-right), and the RGB LED. Make all 4 buttons clickable in the simulator, and show the LED colour.
- Bluetooth mode instructions (everywhere they appear, including the "board not found" message):
  "Put the board in Bluetooth mode: hold button A while switching the board on. Or switch it on and press A while the screen says 'Press A'. The screen then shows your Board ID in big letters."
- The board runs from its battery: USB alone only charges it. Add "Is the board switched on?" to every USB and Bluetooth "not found / can't connect" message.
- Firmware installer, manual mode text: "Switch the board on. On the back, hold BOOT, press and release RST, then release BOOT. The screen stays blank; that is normal."
