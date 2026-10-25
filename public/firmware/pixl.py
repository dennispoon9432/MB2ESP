# pixl.py - kid-friendly runtime for the PIXL board (ESP32-S3 + SSD1306 128x64 OLED)
# Generated programs:  from pixl import *  ...  run()
import machine, time, framebuf, urandom   # urandom: used by "pick random" block
from machine import Pin, I2C, ADC, PWM

# ---------------------------------------------------------------------------
# BOARD PINS  (programs use the real GPIO numbers printed on the board)
# Every pin does digital, PWM/servo, I2C/SPI/UART, DHT, 1-Wire and NeoPixel.
# ADC1 = analog always; ADC2 = analog only while Wi-Fi is off (BLE is fine).
# ---------------------------------------------------------------------------
PINS = (                    # header H1 on the PIXL PCB
    1, 2, 4, 5, 6, 7, 10,   # ADC1  touch
    11, 12, 13,             # ADC2  touch
)
OLED_SDA = 8         # I2C bus: OLED + sockets P1/P2, not in PINS
OLED_SCL = 9
OLED_RES = 17        # OLED reset (bare FPC panel), must be pulsed before init
BUTTONS = {"A": 41, "B": 42, "X": 40, "Y": 47}   # front buttons -> GND
RGB_LED_GPIO = 48    # one WS2812 RGB LED


def pin_gpio(p):
    """Check a GPIO number is a safe PIXL pin. Extensions must use this."""
    if p in PINS:
        return p
    raise ValueError("GPIO%s can't be used. Use GPIO %s" % (p, ", ".join(str(g) for g in PINS)))


# ---------------------------------------------------------------------------
# Screen
# ---------------------------------------------------------------------------
_res = Pin(OLED_RES, Pin.OUT, value=1)
_res.value(0); time.sleep_ms(10); _res.value(1); time.sleep_ms(10)
i2c = I2C(0, sda=Pin(OLED_SDA), scl=Pin(OLED_SCL), freq=400000)
try:
    import ssd1306
    _scr = ssd1306.SSD1306_I2C(128, 64, i2c)
except Exception as e:
    print("pixl: OLED not found:", e)
    _scr = None


class _Oled:
    def _s(self):
        if _scr:
            _scr.show()

    def clear(self):
        if _scr:
            _scr.fill(0); _scr.show()

    def text(self, s, x=0, y=0, color=1):
        if _scr:
            _scr.text(str(s), x, y, color); self._s()

    def pixel(self, x, y, color=1):
        if _scr:
            _scr.pixel(x, y, color); self._s()

    def line(self, x1, y1, x2, y2, color=1):
        if _scr:
            _scr.line(x1, y1, x2, y2, color); self._s()

    def rect(self, x, y, w, h, fill=False, color=1):
        if _scr:
            (_scr.fill_rect if fill else _scr.rect)(x, y, w, h, color); self._s()


oled = _Oled()


class Image:
    HEART = "01010:11111:11111:01110:00100"
    SMALL_HEART = "00000:01010:01110:00100:00000"
    YES = "00000:00001:00010:10100:01000"
    NO = "10001:01010:00100:01010:10001"
    HAPPY = "00000:01010:00000:10001:01110"
    SAD = "00000:01010:00000:01110:10001"
    CONFUSED = "00000:01010:00000:01010:10101"
    ANGRY = "10001:01010:00000:11111:10101"
    ASLEEP = "00000:11011:00000:01110:00000"
    SURPRISED = "01010:00000:00100:01010:00100"
    SILLY = "10001:00000:11111:00011:00011"
    SQUARE = "11111:10001:10001:10001:11111"
    SMALL_SQUARE = "00000:01110:01010:01110:00000"
    DIAMOND = "00100:01010:10001:01010:00100"
    TRIANGLE = "00000:00100:01010:11111:00000"
    ARROW_N = "00100:01110:10101:00100:00100"
    ARROW_S = "00100:00100:10101:01110:00100"
    ARROW_E = "00100:00010:11111:00010:00100"
    ARROW_W = "00100:01000:11111:01000:00100"


_CELL = 12       # 5x5 grid: 12px cells, 10px lit squares, centred
_GX = (128 - 5 * _CELL) // 2
_GY = (64 - 5 * _CELL) // 2


class _Display:
    def __init__(self):
        self._g = bytearray(25)

    def _draw_grid(self):
        if not _scr:
            return
        _scr.fill(0)
        for i in range(25):
            x = _GX + (i % 5) * _CELL + 1
            y = _GY + (i // 5) * _CELL + 1
            if self._g[i]:
                _scr.fill_rect(x, y, 10, 10, 1)
            else:
                _scr.pixel(x + 5, y + 5, 1)      # faint dot = "LED off"
        _scr.show()

    def show_leds(self, pattern):
        bits = [c for c in str(pattern) if c in "01#.*"]
        for i in range(25):
            self._g[i] = 1 if i < len(bits) and bits[i] in "1#*" else 0
        self._draw_grid()

    def show_icon(self, img):
        self.show_leds(img)

    def plot(self, x, y):
        if 0 <= x < 5 and 0 <= y < 5:
            self._g[y * 5 + x] = 1; self._draw_grid()

    def unplot(self, x, y):
        if 0 <= x < 5 and 0 <= y < 5:
            self._g[y * 5 + x] = 0; self._draw_grid()

    def toggle(self, x, y):
        if 0 <= x < 5 and 0 <= y < 5:
            self._g[y * 5 + x] ^= 1; self._draw_grid()

    def point(self, x, y):
        return 0 <= x < 5 and 0 <= y < 5 and self._g[y * 5 + x] == 1

    def clear(self):
        self._g = bytearray(25)
        if _scr:
            _scr.fill(0); _scr.show()

    def _big(self, s, scale=3):
        w = len(s) * 8
        src = framebuf.FrameBuffer(bytearray(w), w, 8, framebuf.MONO_VLSB)
        src.text(s, 0, 0, 1)
        W, H = w * scale, 8 * scale
        dst = framebuf.FrameBuffer(bytearray(W * ((H + 7) // 8)), W, H, framebuf.MONO_VLSB)
        for y in range(8):
            for x in range(w):
                if src.pixel(x, y):
                    dst.fill_rect(x * scale, y * scale, scale, scale, 1)
        return dst, W, H

    def show_string(self, s, interval=150):
        s = str(s)
        if not _scr:
            print(s); return
        fb, W, H = self._big(s)
        y = (64 - H) // 2
        if W <= 128:                               # fits: show centred
            _scr.fill(0); _scr.blit(fb, (128 - W) // 2, y); _scr.show()
            pause(interval * 4 if len(s) > 1 else interval)
            return
        step = 6                                   # too long: scroll
        delay = max(10, interval // 5)
        for x in range(128, -W - 1, -step):
            _scr.fill(0); _scr.blit(fb, x, y); _scr.show()
            pause(delay)
        _scr.fill(0); _scr.show()

    def show_number(self, n):
        if isinstance(n, float) and n == int(n):
            n = int(n)
        self.show_string(str(n))


display = _Display()


# ---------------------------------------------------------------------------
# Buttons
# ---------------------------------------------------------------------------
class _Button:
    def __init__(self, gpio):
        self._p = Pin(gpio, Pin.IN, Pin.PULL_UP)
        time.sleep_ms(10)  # stabilize pull-up
        self._presses = 0
        self._last_press = time.ticks_ms()
        self._last_release = time.ticks_ms()
        self._pressed_state = (self._p.value() == 0)
        self._p.irq(self._irq, Pin.IRQ_FALLING | Pin.IRQ_RISING)
        self._presses = 0

    def _irq(self, _):
        now = time.ticks_ms()
        val = self._p.value()
        if val == 0:  # Button active LOW (pressed down)
            if not self._pressed_state:
                if time.ticks_diff(now, self._last_press) > 150 and time.ticks_diff(now, self._last_release) > 50:
                    self._pressed_state = True
                    self._presses += 1
                    self._last_press = now
        else:  # Button released (HIGH)
            if self._pressed_state:
                if time.ticks_diff(now, self._last_press) > 30:
                    self._pressed_state = False
                    self._last_release = now

    def is_pressed(self):
        val = (self._p.value() == 0)
        if not val:
            self._pressed_state = False
            return False
        time.sleep_us(50)  # filter microsecond line noise
        return self._p.value() == 0

    def was_pressed(self):
        n = self._presses
        self._presses = 0
        if self._p.value() == 1:
            self._pressed_state = False
        return n > 0


button_a = _Button(BUTTONS["A"])
button_b = _Button(BUTTONS["B"])
button_x = _Button(BUTTONS["X"])
button_y = _Button(BUTTONS["Y"])
_buttons = {"A": button_a, "B": button_b, "X": button_x, "Y": button_y}

# Flush any boot/upload transition artifacts
time.sleep_ms(10)
for _b in _buttons.values():
    _b._presses = 0

_handlers = {"A": [], "B": [], "X": [], "Y": [], "AB": []}
_forever = []
_in_handler = False
_start = time.ticks_ms()


def on_button(which):
    def deco(fn):
        _handlers[which.upper()].append(fn)
        return fn
    return deco


def forever(fn):
    _forever.append(fn)
    return fn


def _dispatch():
    """Run button handlers for presses since last check (not re-entrant)."""
    global _in_handler
    if _in_handler:
        return
    # Resync button states when physical pin is released
    for b in _buttons.values():
        if b._p.value() == 1:
            b._pressed_state = False

    pressed = [k for k, b in _buttons.items() if b._presses]
    if not pressed:
        return
    for k in pressed:
        _buttons[k]._presses = 0
    _in_handler = True
    try:
        evs = [k for k in pressed if k in "XY"]
        a, b = "A" in pressed, "B" in pressed
        if (a and b) or (a and button_b.is_pressed()) or (b and button_a.is_pressed()):
            evs.append("AB")
        else:
            evs += (["A"] if a else []) + (["B"] if b else [])
        for ev in evs:
            for fn in _handlers[ev]:
                fn()
    finally:
        _in_handler = False


def pause(ms):
    """Wait, but still react to buttons (like a micro:bit)."""
    end = time.ticks_add(time.ticks_ms(), int(ms))
    while time.ticks_diff(end, time.ticks_ms()) > 0:
        _dispatch()
        time.sleep_ms(min(10, max(0, time.ticks_diff(end, time.ticks_ms()))))


def running_time():
    return time.ticks_diff(time.ticks_ms(), _start)


def run():
    while True:
        for fn in _forever:
            fn()
            _dispatch()
            time.sleep_ms(20)
        if not _forever:
            _dispatch()
            time.sleep_ms(20)


# ---------------------------------------------------------------------------
# Pins (micro:bit-style ranges: digital 0/1, analog 0-1023, servo 0-180)
# ---------------------------------------------------------------------------
_pwm = {}


def _free_pwm(p):
    if p in _pwm:
        _pwm.pop(p).deinit()


def pin_write(p, v):
    _free_pwm(p)
    Pin(pin_gpio(p), Pin.OUT).value(1 if v else 0)


def pin_read(p):
    _free_pwm(p)
    return Pin(pin_gpio(p), Pin.IN, Pin.PULL_DOWN).value()


def analog_read(p):
    _free_pwm(p)
    adc = ADC(Pin(pin_gpio(p)), atten=ADC.ATTN_11DB)
    return adc.read_u16() >> 6


def analog_write(p, v):
    if p not in _pwm:
        _pwm[p] = PWM(Pin(pin_gpio(p)), freq=1000)
    _pwm[p].duty_u16(max(0, min(1023, int(v))) * 64)


def servo(p, angle):
    if p not in _pwm:
        _pwm[p] = PWM(Pin(pin_gpio(p)), freq=50)
    _pwm[p].freq(50)
    angle = max(0, min(180, angle))
    _pwm[p].duty_ns(int(500_000 + angle * 2_000_000 / 180))


def servo_stop(p):
    _free_pwm(p)


# ---------------------------------------------------------------------------
# RGB LED (one WS2812 on the board), colors 0-255, brightness 0-255
# ---------------------------------------------------------------------------
class _RgbLed:
    def __init__(self):
        self._np = None
        self._brightness = 255
        self._rgb = (0, 0, 0)
        try:
            import neopixel
            self._np = neopixel.NeoPixel(Pin(RGB_LED_GPIO), 1)
            self._np[0] = (0, 0, 0)
            self._np.write()
        except Exception:
            pass

    def brightness(self, val):
        self._brightness = max(0, min(255, int(val)))
        if self._rgb != (0, 0, 0):
            self._write()

    def color(self, r, g, b):
        self._rgb = (int(r), int(g), int(b))
        self._write()

    def _write(self):
        try:
            if self._np is None:
                import neopixel
                self._np = neopixel.NeoPixel(Pin(RGB_LED_GPIO), 1)
            scale = self._brightness / 255.0
            r, g, b = self._rgb
            self._np[0] = (
                max(0, min(255, int(r * scale))),
                max(0, min(255, int(g * scale))),
                max(0, min(255, int(b * scale)))
            )
            self._np.write()
        except Exception:
            pass

    def off(self):
        self._rgb = (0, 0, 0)
        self._write()


led = _RgbLed()
