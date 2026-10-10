import { ProjectExtension } from './project';

export interface ExtensionManifest {
  name: string;
  category: string;
  color: string;
  description: string;
  blocks: ExtensionBlockDefinition[];
}

export interface ExtensionBlockDefinition {
  type: string;
  message0: string;
  args0?: any[];
  previousStatement?: any;
  nextStatement?: any;
  output?: any;
  colour?: string | number;
  tooltip?: string;
  helpUrl?: string;
  python: string; // python template string, e.g. "np_set_pixel({INDEX}, {COLOR})"
  jsSimulator?: string; // js template for simulator
}

export const BUILTIN_EXTENSIONS: ProjectExtension[] = [
  {
    id: 'neopixel',
    name: 'NeoPixel WS2812',
    description: 'Control RGB NeoPixel LED strips and rings with custom colors and animations.',
    category: 'NeoPixel',
    color: '#FF7F00',
    icon: 'Sparkles',
    isBuiltIn: true,
    extPy: `# NeoPixel Driver for MB2ESP
import machine, neopixel
_np = None

def neopixel_init(pin_num=0, num_leds=8):
    global _np
    _np = neopixel.NeoPixel(machine.Pin(pin_num), num_leds)

def neopixel_set(index, r, g, b):
    global _np
    if _np and 0 <= index < len(_np):
        _np[index] = (r, g, b)

def neopixel_show():
    global _np
    if _np:
        _np.write()

def neopixel_clear():
    global _np
    if _np:
        _np.fill((0, 0, 0))
        _np.write()
`,
    blocksJson: [
      {
        type: 'ext_neopixel_init',
        message0: 'initialize neopixel on %1 with %2 leds',
        args0: [
          {
            type: 'field_dropdown',
            name: 'PIN',
            options: [
              ['P0', '0'],
              ['P1', '1'],
              ['P2', '2'],
              ['P8', '8']
            ]
          },
          {
            type: 'field_number',
            name: 'NUM',
            value: 8,
            min: 1,
            max: 64
          }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF7F00',
        tooltip: 'Initialize NeoPixel LED strip',
        python: 'neopixel_init({PIN}, {NUM})'
      },
      {
        type: 'ext_neopixel_set_color',
        message0: 'set neopixel # %1 to color R %2 G %3 B %4',
        args0: [
          {
            type: 'input_value',
            name: 'INDEX',
            check: 'Number'
          },
          {
            type: 'field_number',
            name: 'R',
            value: 255,
            min: 0,
            max: 255
          },
          {
            type: 'field_number',
            name: 'G',
            value: 0,
            min: 0,
            max: 255
          },
          {
            type: 'field_number',
            name: 'B',
            value: 0,
            min: 0,
            max: 255
          }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF7F00',
        tooltip: 'Set specific NeoPixel LED color',
        python: 'neopixel_set({INDEX}, {R}, {G}, {B})'
      },
      {
        type: 'ext_neopixel_show',
        message0: 'neopixel show changes',
        previousStatement: null,
        nextStatement: null,
        colour: '#FF7F00',
        tooltip: 'Send color changes to the strip',
        python: 'neopixel_show()'
      },
      {
        type: 'ext_neopixel_clear',
        message0: 'neopixel clear all',
        previousStatement: null,
        nextStatement: null,
        colour: '#FF7F00',
        tooltip: 'Turn off all pixels',
        python: 'neopixel_clear()'
      }
    ]
  },
  {
    id: 'servo',
    name: 'Servo Motors',
    description: 'Control 180-degree positional and continuous 360-degree rotation servos.',
    category: 'Servo',
    color: '#2E8B57',
    icon: 'Cog',
    isBuiltIn: true,
    extPy: `# Servo Driver for MB2ESP
import machine

_servos = {}

def servo_continuous(pin_num, speed):
    # speed from -100 to 100
    angle = int(90 + (speed * 90 / 100))
    servo(pin_num, angle)

def servo_stop(pin_num):
    pin_write(pin_num, 0)
`,
    blocksJson: [
      {
        type: 'ext_servo_continuous',
        message0: 'continuous servo %1 speed %2 (-100 to 100)',
        args0: [
          {
            type: 'field_dropdown',
            name: 'PIN',
            options: [
              ['P0', '0'],
              ['P1', '1'],
              ['P2', '2'],
              ['P8', '8']
            ]
          },
          {
            type: 'input_value',
            name: 'SPEED',
            check: 'Number'
          }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#2E8B57',
        tooltip: 'Rotate continuous servo with variable speed and direction',
        python: 'servo_continuous({PIN}, {SPEED})'
      },
      {
        type: 'ext_servo_stop',
        message0: 'stop servo on %1',
        args0: [
          {
            type: 'field_dropdown',
            name: 'PIN',
            options: [
              ['P0', '0'],
              ['P1', '1'],
              ['P2', '2'],
              ['P8', '8']
            ]
          }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#2E8B57',
        tooltip: 'Stop sending PWM pulses to servo',
        python: 'servo_stop({PIN})'
      }
    ]
  }
];
