from pixl import *

oled.clear()
oled.text("PIXL ready!", 0, 0)
oled.text("Upload a program", 0, 20)
oled.text("from the web app", 0, 32)

run()  # always the last line
