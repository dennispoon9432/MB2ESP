# main.py - hardware test for the PIXL board (replace it from the web app)
from pixl import *

oled.clear()
oled.text("PIXL test v3", 0, 0)
oled.text("Press A B X Y", 0, 20)
led.color(0, 0, 40)

def show(name, r, g, b):
    oled.rect(0, 40, 128, 12, fill=True, color=0)
    oled.text("Button " + name, 0, 40)
    led.color(r, g, b)
    print(name, "pressed at", running_time(), "ms")

@on_button("A")
def on_a():
    show("A", 40, 0, 0)

@on_button("B")
def on_b():
    show("B", 0, 40, 0)

@on_button("X")
def on_x():
    show("X", 40, 40, 0)

@on_button("Y")
def on_y():
    show("Y", 40, 0, 40)

@forever
def loop():
    pause(1000)

run()  # always the last line
