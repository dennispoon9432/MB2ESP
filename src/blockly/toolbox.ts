import { ProjectExtension } from '../types/project';
import {
  COLOR_BASIC,
  COLOR_INPUT,
  COLOR_DISPLAY,
  COLOR_LED,
  COLOR_PINS,
  COLOR_LOOPS,
  COLOR_LOGIC,
  COLOR_VARIABLES,
  COLOR_MATH,
  COLOR_EXTENSIONS
} from './blocks';

export function getToolbox(extensions: ProjectExtension[] = []): any {
  const contents: any[] = [
    {
      kind: 'category',
      name: 'Basic',
      colour: COLOR_BASIC,
      contents: [
        {
          kind: 'block',
          type: 'mb_oled_show_text',
          inputs: {
            TEXT: { shadow: { type: 'text', fields: { TEXT: 'MB2ESP' } } },
            X: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } },
            Y: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } }
          }
        },
        {
          kind: 'block',
          type: 'mb_oled_show_number',
          inputs: {
            NUMBER: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } },
            X: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } },
            Y: { shadow: { type: 'mb_math_number', fields: { NUM: 16 } } }
          }
        },
        { kind: 'block', type: 'mb_oled_clear' },
        { kind: 'block', type: 'mb_pause', inputs: { MS: { shadow: { type: 'mb_math_number', fields: { NUM: 500 } } } } },
        { kind: 'block', type: 'mb_forever' },
        { kind: 'block', type: 'mb_on_start' }
      ]
    },
    {
      kind: 'category',
      name: 'Input',
      colour: COLOR_INPUT,
      contents: [
        { kind: 'block', type: 'mb_on_button_pressed' },
        { kind: 'block', type: 'mb_button_is_pressed' },
        { kind: 'block', type: 'mb_running_time' }
      ]
    },
    {
      kind: 'category',
      name: 'Display / OLED',
      colour: COLOR_DISPLAY,
      contents: [
        {
          kind: 'block',
          type: 'mb_oled_show_text',
          inputs: {
            TEXT: { shadow: { type: 'text', fields: { TEXT: 'Hello' } } },
            X: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } },
            Y: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } }
          }
        },
        {
          kind: 'block',
          type: 'mb_oled_show_number',
          inputs: {
            NUMBER: { shadow: { type: 'mb_math_number', fields: { NUM: 123 } } },
            X: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } },
            Y: { shadow: { type: 'mb_math_number', fields: { NUM: 16 } } }
          }
        },
        {
          kind: 'block',
          type: 'mb_oled_draw_line',
          inputs: {
            X1: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } },
            Y1: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } },
            X2: { shadow: { type: 'mb_math_number', fields: { NUM: 127 } } },
            Y2: { shadow: { type: 'mb_math_number', fields: { NUM: 63 } } }
          }
        },
        {
          kind: 'block',
          type: 'mb_oled_draw_rect',
          inputs: {
            X: { shadow: { type: 'mb_math_number', fields: { NUM: 10 } } },
            Y: { shadow: { type: 'mb_math_number', fields: { NUM: 10 } } },
            W: { shadow: { type: 'mb_math_number', fields: { NUM: 40 } } },
            H: { shadow: { type: 'mb_math_number', fields: { NUM: 20 } } }
          }
        },
        { kind: 'block', type: 'mb_oled_clear' }
      ]
    },
    {
      kind: 'category',
      name: 'LED',
      colour: COLOR_LED,
      contents: [
        {
          kind: 'block',
          type: 'mb_led_set_color'
        },
        {
          kind: 'block',
          type: 'mb_led_set_rgb',
          inputs: {
            R: { shadow: { type: 'mb_math_number', fields: { NUM: 255 } } },
            G: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } },
            B: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } }
          }
        },
        {
          kind: 'block',
          type: 'mb_led_set_brightness',
          inputs: {
            BRIGHTNESS: { shadow: { type: 'mb_math_number', fields: { NUM: 255 } } }
          }
        },
        {
          kind: 'block',
          type: 'mb_led_off'
        }
      ]
    },
    {
      kind: 'category',
      name: 'Pins',
      colour: COLOR_PINS,
      contents: [
        {
          kind: 'block',
          type: 'mb_digital_write_pin',
          inputs: {
            VALUE: { shadow: { type: 'mb_math_number', fields: { NUM: 1 } } }
          }
        },
        { kind: 'block', type: 'mb_digital_read_pin' },
        { kind: 'block', type: 'mb_analog_read_pin' },
        {
          kind: 'block',
          type: 'mb_analog_write_pin',
          inputs: {
            VALUE: { shadow: { type: 'mb_math_number', fields: { NUM: 512 } } }
          }
        },
        {
          kind: 'block',
          type: 'mb_servo_write_pin',
          inputs: {
            ANGLE: { shadow: { type: 'mb_math_number', fields: { NUM: 90 } } }
          }
        }
      ]
    },
    {
      kind: 'category',
      name: 'Loops',
      colour: COLOR_LOOPS,
      contents: [
        {
          kind: 'block',
          type: 'mb_repeat',
          inputs: {
            TIMES: { shadow: { type: 'mb_math_number', fields: { NUM: 4 } } }
          }
        },
        { kind: 'block', type: 'mb_while' },
        { kind: 'block', type: 'mb_for_index' }
      ]
    },
    {
      kind: 'category',
      name: 'Logic',
      colour: COLOR_LOGIC,
      contents: [
        { kind: 'block', type: 'mb_if' },
        {
          kind: 'block',
          type: 'mb_compare',
          inputs: {
            A: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } },
            B: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } }
          }
        },
        { kind: 'block', type: 'mb_and_or' },
        { kind: 'block', type: 'mb_not' },
        { kind: 'block', type: 'mb_boolean' }
      ]
    },
    {
      kind: 'category',
      name: 'Variables',
      colour: COLOR_VARIABLES,
      custom: 'VARIABLE'
    },
    {
      kind: 'category',
      name: 'Math',
      colour: COLOR_MATH,
      contents: [
        { kind: 'block', type: 'mb_math_number' },
        {
          kind: 'block',
          type: 'mb_math_arithmetic',
          inputs: {
            A: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } },
            B: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } }
          }
        },
        {
          kind: 'block',
          type: 'mb_math_random',
          inputs: {
            MAX: { shadow: { type: 'mb_math_number', fields: { NUM: 10 } } }
          }
        },
        {
          kind: 'block',
          type: 'mb_math_min_max',
          inputs: {
            A: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } },
            B: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } }
          }
        },
        {
          kind: 'block',
          type: 'mb_math_abs',
          inputs: {
            NUM: { shadow: { type: 'mb_math_number', fields: { NUM: 0 } } }
          }
        }
      ]
    }
  ];

  // Extension categories
  for (const ext of extensions) {
    if (ext.blocksJson && ext.blocksJson.length > 0) {
      contents.push({
        kind: 'category',
        name: ext.category || ext.name,
        colour: ext.color || COLOR_EXTENSIONS,
        contents: ext.blocksJson.map(b => ({ kind: 'block', type: b.type }))
      });
    }
  }

  // Extensions manage button
  contents.push({
    kind: 'category',
    name: 'Extensions',
    colour: COLOR_EXTENSIONS,
    custom: 'EXTENSIONS_CATEGORY'
  });

  return {
    kind: 'categoryToolbox',
    contents
  };
}
