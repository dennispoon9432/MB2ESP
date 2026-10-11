# boot.py - PIXL / MB2ESP bootloader for ESP32-S3 (MicroPython + aioble + ssd1306)
#
# Runs on EVERY reset, before main.py. It is never overwritten by uploads
# (uploads only replace main.py), so a broken main.py can never lock you out.
#
# How to enter Bluetooth upload mode:
#   Prototype (ESP32-S3 DevKit, Button A = BOOT/GPIO0):
#       press RST, release it, then press BOOT while the screen says
#       "Press A for upload" (1.5 s window).
#       (Do NOT hold BOOT while pressing RST: that enters the ROM flasher.)
#   Final PCB (Button A on a non-strapping pin, e.g. GPIO14):
#       hold A and tap RST, same as a micro:bit.
#
# BLE protocol (Nordic UART service), packets written with response:
#   [0x01]                         START -> open main.tmp
#   [0x02 + data]                  DATA  -> append bytes
#   [0x03]                         END   -> commit, no check (old web app)
#   [0x03 + len(4,LE) + crc32(4,LE)] END -> verify, then commit
# Board notifies "OK" on success, or "ERR:<reason>" (the web app should retry).

import machine, time
from micropython import const

UPLOAD_PIN = const(0)       # Button A. Prototype: 0 (BOOT). Final PCB: 14
OLED_SDA = const(8)
OLED_SCL = const(9)
WINDOW_MS = const(1500)
VERSION = "0.2"


def _oled():
    try:
        import ssd1306
        i2c = machine.I2C(0, sda=machine.Pin(OLED_SDA), scl=machine.Pin(OLED_SCL), freq=400000)
        return ssd1306.SSD1306_I2C(128, 64, i2c)
    except Exception as e:
        print("boot: no OLED:", e)
        return None


def _show(o, *lines):
    if o:
        o.fill(0)
        for i, s in enumerate(lines):
            o.text(s, 0, i * 11)
        o.show()


def _board_id():
    # Last 3 bytes of the factory MAC, e.g. "A96E08": what kids type in the web app.
    import binascii
    return binascii.hexlify(machine.unique_id()).decode().upper()[-6:]


def _show_id(o, top, bid, *bottom):
    # Title line, the board ID in double-size text, then up to two status lines.
    if not o:
        return
    import framebuf
    w = len(bid) * 8
    src = framebuf.FrameBuffer(bytearray(w), w, 8, framebuf.MONO_VLSB)
    src.text(bid, 0, 0, 1)
    o.fill(0)
    o.text(top, 0, 0)
    x0 = (128 - w * 2) // 2
    for y in range(8):
        for x in range(w):
            if src.pixel(x, y):
                o.fill_rect(x0 + x * 2, 16 + y * 2, 2, 2, 1)
    for i, s in enumerate(bottom):
        o.text(s, 0, 42 + i * 11)
    o.show()


def _rtc_flag(value=None):
    # RTC memory survives machine.reset(); used to skip the window right after an upload.
    try:
        rtc = machine.RTC()
        old = rtc.memory()
        if value is not None:
            rtc.memory(value)
        return old
    except Exception:
        return b""


def _wants_upload(o):
    btn = machine.Pin(UPLOAD_PIN, machine.Pin.IN, machine.Pin.PULL_UP)
    if btn.value() == 0:                       # held during reset (final PCB)
        return True
    if machine.reset_cause() == machine.SOFT_RESET:
        return False                           # USB upload / Ctrl-D: start fast
    if _rtc_flag(b"") == b"JUSTFLASHED":
        return False                           # run the new program straight away
    _show(o, "PIXL v" + VERSION, "ID " + _board_id(), "", "Press A for", "BLE upload...")
    t0 = time.ticks_ms()
    while time.ticks_diff(time.ticks_ms(), t0) < WINDOW_MS:
        if btn.value() == 0:
            return True
        time.sleep_ms(10)
    if o:
        o.fill(0); o.show()
    return False


try:
    from binascii import crc32
except ImportError:
    def crc32(data, crc=0):
        crc ^= 0xFFFFFFFF
        for b in data:
            crc ^= b
            for _ in range(8):
                crc = (crc >> 1) ^ (0xEDB88320 if crc & 1 else 0)
        return crc ^ 0xFFFFFFFF


def _upload_mode(o):
    import asyncio, bluetooth, aioble, os

    name = _board_id()                     # BLE name = board ID, e.g. "A96E08"
    svc_uuid = bluetooth.UUID("6e400001-b5a3-f393-e0a9-e50e24dcca9e")
    svc = aioble.Service(svc_uuid)
    rx = aioble.Characteristic(svc, bluetooth.UUID("6e400002-b5a3-f393-e0a9-e50e24dcca9e"),
                               write=True, write_no_response=True, capture=True)
    tx = aioble.Characteristic(svc, bluetooth.UUID("6e400003-b5a3-f393-e0a9-e50e24dcca9e"),
                               notify=True)
    aioble.register_services(svc)
    aioble.core.ble.gatts_set_buffer(rx._value_handle, 256)
    try:
        aioble.config(mtu=247, gap_name=name)
    except Exception:
        pass

    def notify(conn, msg):
        try:
            tx.notify(conn, msg)
        except Exception:
            pass
        print("ble:", msg)

    async def serve():
        while True:
            _show_id(o, "BLE UPLOAD MODE", name, "Waiting...", "RST = exit")
            conn = await aioble.advertise(100_000, name=name, services=[svc_uuid])
            _show_id(o, "BLE UPLOAD MODE", name, "Connected")
            f = None
            size = 0
            crc = 0
            while conn.is_connected():
                try:
                    _, data = await rx.written(timeout_ms=500)
                except asyncio.TimeoutError:
                    continue
                if not data:
                    continue
                cmd = data[0]
                if cmd == 0x01:                              # START
                    if f:
                        f.close()
                    f = open("main.tmp", "wb")
                    size = 0
                    crc = 0
                    _show_id(o, "BLE UPLOAD MODE", name, "Receiving...")
                elif cmd == 0x02 and f:                      # DATA
                    chunk = data[1:]
                    f.write(chunk)
                    size += len(chunk)
                    crc = crc32(chunk, crc)
                elif cmd == 0x03 and f:                      # END
                    f.close()
                    f = None
                    if len(data) >= 9:
                        want_len = int.from_bytes(data[1:5], "little")
                        want_crc = int.from_bytes(data[5:9], "little")
                        if want_len != size:
                            notify(conn, "ERR:len %d!=%d" % (size, want_len))
                            continue
                        if want_crc != (crc & 0xFFFFFFFF):
                            notify(conn, "ERR:crc")
                            continue
                    try:
                        os.remove("main.py")
                    except OSError:
                        pass
                    os.rename("main.tmp", "main.py")
                    notify(conn, "OK")
                    _show(o, "Upload OK", "", "%d bytes" % size, "", "Restarting...")
                    await asyncio.sleep_ms(400)
                    _rtc_flag(b"JUSTFLASHED")
                    machine.reset()
                elif cmd == 0x04:                            # INFO (optional)
                    notify(conn, "PIXL " + VERSION)
                else:
                    notify(conn, "ERR:no START")
            if f:
                f.close()

    asyncio.run(serve())


_o = _oled()
if _wants_upload(_o):
    _upload_mode(_o)        # never returns (ends with machine.reset())
del _o
