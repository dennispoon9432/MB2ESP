import * as Blockly from 'blockly';
import { pythonGenerator, Order } from 'blockly/python';
import { ProjectExtension } from '../types/project';

let generatorsRegistered = false;

export function registerPythonGenerators(): void {
  if (generatorsRegistered) return;
  generatorsRegistered = true;

  // Basic category
  pythonGenerator.forBlock['mb_on_start'] = function (block) {
    const doCode = pythonGenerator.statementToCode(block, 'DO');
    return `# On Start\n${doCode || 'pass'}\n`;
  };

  pythonGenerator.forBlock['mb_forever'] = function (block) {
    const doCode = pythonGenerator.statementToCode(block, 'DO');
    const safeBody = doCode.trim() ? doCode : '    pass\n';
    return `\n@forever\ndef forever_loop():\n${safeBody}\n`;
  };

  pythonGenerator.forBlock['mb_pause'] = function (block) {
    const ms = pythonGenerator.valueToCode(block, 'MS', Order.NONE) || '100';
    return `pause(${ms})\n`;
  };

  // Input category
  pythonGenerator.forBlock['mb_on_button_pressed'] = function (block) {
    const btn = block.getFieldValue('BUTTON') || 'A';
    const funcName = `on_button_${btn.toLowerCase().replace('+', '_')}`;
    const doCode = pythonGenerator.statementToCode(block, 'DO');
    const safeBody = doCode.trim() ? doCode : '    pass\n';
    return `\n@on_button("${btn}")\ndef ${funcName}():\n${safeBody}\n`;
  };

  pythonGenerator.forBlock['mb_button_is_pressed'] = function (block) {
    const btn = (block.getFieldValue('BUTTON') || 'A').toLowerCase();
    const code = `button_${btn}.is_pressed()`;
    return [code, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['mb_running_time'] = function () {
    return ['running_time()', Order.FUNCTION_CALL];
  };

  // RGB LED category
  pythonGenerator.forBlock['mb_led_set_color'] = function (block) {
    const raw = block.getFieldValue('COLOR') || '#ff8800';
    const hex = raw.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `led.color(${r}, ${g}, ${b})\n`;
  };

  pythonGenerator.forBlock['mb_led_set_rgb'] = function (block) {
    const r = pythonGenerator.valueToCode(block, 'R', Order.NONE) || '0';
    const g = pythonGenerator.valueToCode(block, 'G', Order.NONE) || '0';
    const b = pythonGenerator.valueToCode(block, 'B', Order.NONE) || '0';
    return `led.color(${r}, ${g}, ${b})\n`;
  };

  pythonGenerator.forBlock['mb_led_set_brightness'] = function (block) {
    const b = pythonGenerator.valueToCode(block, 'BRIGHTNESS', Order.NONE) || '255';
    return `led.brightness(${b})\n`;
  };

  pythonGenerator.forBlock['mb_led_off'] = function () {
    return 'led.off()\n';
  };

  // Display / OLED category
  pythonGenerator.forBlock['mb_oled_show_number'] = function (block) {
    const num = pythonGenerator.valueToCode(block, 'NUMBER', Order.NONE) || '0';
    const x = pythonGenerator.valueToCode(block, 'X', Order.NONE) || '0';
    const y = pythonGenerator.valueToCode(block, 'Y', Order.NONE) || '0';
    return `oled.text(str(${num}), ${x}, ${y})\n`;
  };

  pythonGenerator.forBlock['mb_oled_show_text'] = function (block) {
    const text = pythonGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""';
    const x = pythonGenerator.valueToCode(block, 'X', Order.NONE) || '0';
    const y = pythonGenerator.valueToCode(block, 'Y', Order.NONE) || '0';
    return `oled.text(${text}, ${x}, ${y})\n`;
  };

  pythonGenerator.forBlock['mb_oled_draw_line'] = function (block) {
    const x1 = pythonGenerator.valueToCode(block, 'X1', Order.NONE) || '0';
    const y1 = pythonGenerator.valueToCode(block, 'Y1', Order.NONE) || '0';
    const x2 = pythonGenerator.valueToCode(block, 'X2', Order.NONE) || '0';
    const y2 = pythonGenerator.valueToCode(block, 'Y2', Order.NONE) || '0';
    return `oled.line(${x1}, ${y1}, ${x2}, ${y2})\n`;
  };

  pythonGenerator.forBlock['mb_oled_draw_rect'] = function (block) {
    const x = pythonGenerator.valueToCode(block, 'X', Order.NONE) || '0';
    const y = pythonGenerator.valueToCode(block, 'Y', Order.NONE) || '0';
    const w = pythonGenerator.valueToCode(block, 'W', Order.NONE) || '10';
    const h = pythonGenerator.valueToCode(block, 'H', Order.NONE) || '10';
    return `oled.rect(${x}, ${y}, ${w}, ${h})\n`;
  };

  pythonGenerator.forBlock['mb_oled_clear'] = function () {
    return 'oled.clear()\n';
  };

  // Pins category
  pythonGenerator.forBlock['mb_digital_write_pin'] = function (block) {
    const pin = block.getFieldValue('PIN') || '1';
    const val = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || '0';
    return `pin_write(${pin}, ${val})\n`;
  };

  pythonGenerator.forBlock['mb_digital_read_pin'] = function (block) {
    const pin = block.getFieldValue('PIN') || '1';
    return [`pin_read(${pin})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['mb_analog_read_pin'] = function (block) {
    const pin = block.getFieldValue('PIN') || '1';
    return [`analog_read(${pin})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['mb_analog_write_pin'] = function (block) {
    const pin = block.getFieldValue('PIN') || '1';
    const val = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || '512';
    return `analog_write(${pin}, ${val})\n`;
  };

  pythonGenerator.forBlock['mb_servo_write_pin'] = function (block) {
    const pin = block.getFieldValue('PIN') || '1';
    const angle = pythonGenerator.valueToCode(block, 'ANGLE', Order.NONE) || '90';
    return `servo(${pin}, ${angle})\n`;
  };

  // Loops category
  pythonGenerator.forBlock['mb_repeat'] = function (block) {
    const times = pythonGenerator.valueToCode(block, 'TIMES', Order.NONE) || '4';
    const doCode = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    return `for _ in range(${times}):\n${doCode}`;
  };

  pythonGenerator.forBlock['mb_while'] = function (block) {
    const cond = pythonGenerator.valueToCode(block, 'BOOL', Order.NONE) || 'False';
    const doCode = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    return `while ${cond}:\n${doCode}`;
  };

  pythonGenerator.forBlock['mb_for_index'] = function (block) {
    const fromVal = block.getFieldValue('FROM') || '0';
    const toVal = block.getFieldValue('TO') || '4';
    const doCode = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    return `for index in range(${fromVal}, ${parseInt(toVal, 10) + 1}):\n${doCode}`;
  };

  // Logic category
  pythonGenerator.forBlock['mb_if'] = function (block) {
    const cond = pythonGenerator.valueToCode(block, 'IF0', Order.NONE) || 'False';
    const doCode = pythonGenerator.statementToCode(block, 'DO0') || '    pass\n';
    let code = `if ${cond}:\n${doCode}`;
    if (block.getInput('ELSE')) {
      const elseCode = pythonGenerator.statementToCode(block, 'ELSE');
      if (elseCode && elseCode.trim()) {
        code += `else:\n${elseCode}`;
      }
    }
    return code;
  };

  pythonGenerator.forBlock['mb_compare'] = function (block) {
    const a = pythonGenerator.valueToCode(block, 'A', Order.RELATIONAL) || '0';
    const b = pythonGenerator.valueToCode(block, 'B', Order.RELATIONAL) || '0';
    const opKey = block.getFieldValue('OP') || 'EQ';
    const ops: Record<string, string> = {
      EQ: '==',
      NEQ: '!=',
      LT: '<',
      LTE: '<=',
      GT: '>',
      GTE: '>='
    };
    const op = ops[opKey] || '==';
    return [`${a} ${op} ${b}`, Order.RELATIONAL];
  };

  pythonGenerator.forBlock['mb_and_or'] = function (block) {
    const a = pythonGenerator.valueToCode(block, 'A', Order.LOGICAL_AND) || 'False';
    const b = pythonGenerator.valueToCode(block, 'B', Order.LOGICAL_AND) || 'False';
    const op = block.getFieldValue('OP') === 'OR' ? 'or' : 'and';
    const order = op === 'or' ? Order.LOGICAL_OR : Order.LOGICAL_AND;
    return [`${a} ${op} ${b}`, order];
  };

  pythonGenerator.forBlock['mb_not'] = function (block) {
    const boolVal = pythonGenerator.valueToCode(block, 'BOOL', Order.LOGICAL_NOT) || 'False';
    return [`not ${boolVal}`, Order.LOGICAL_NOT];
  };

  pythonGenerator.forBlock['mb_boolean'] = function (block) {
    const val = block.getFieldValue('BOOL') === 'TRUE' ? 'True' : 'False';
    return [val, Order.ATOMIC];
  };

  // Math category
  pythonGenerator.forBlock['mb_math_number'] = function (block) {
    const num = block.getFieldValue('NUM') || '0';
    return [num, Order.ATOMIC];
  };

  pythonGenerator.forBlock['mb_math_arithmetic'] = function (block) {
    const a = pythonGenerator.valueToCode(block, 'A', Order.ADDITIVE) || '0';
    const b = pythonGenerator.valueToCode(block, 'B', Order.ADDITIVE) || '0';
    const op = block.getFieldValue('OP') || 'ADD';
    const opMap: Record<string, [string, number]> = {
      ADD: ['+', Order.ADDITIVE],
      MINUS: ['-', Order.ADDITIVE],
      MULTIPLY: ['*', Order.MULTIPLICATIVE],
      DIVIDE: ['/', Order.MULTIPLICATIVE],
      POWER: ['**', Order.EXPONENTIATION]
    };
    const [symbol, order] = opMap[op] || ['+', Order.ADDITIVE];
    return [`${a} ${symbol} ${b}`, order];
  };

  pythonGenerator.forBlock['mb_math_random'] = function (block) {
    const maxVal = pythonGenerator.valueToCode(block, 'MAX', Order.NONE) || '10';
    return [`urandom.randint(0, ${maxVal})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['mb_math_min_max'] = function (block) {
    const op = block.getFieldValue('OP') === 'MAX' ? 'max' : 'min';
    const a = pythonGenerator.valueToCode(block, 'A', Order.NONE) || '0';
    const b = pythonGenerator.valueToCode(block, 'B', Order.NONE) || '0';
    return [`${op}(${a}, ${b})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['mb_math_abs'] = function (block) {
    const op = block.getFieldValue('OP') === 'SQRT' ? 'math.sqrt' : 'abs';
    const num = pythonGenerator.valueToCode(block, 'NUM', Order.NONE) || '0';
    return [`${op}(${num})`, Order.FUNCTION_CALL];
  };
}

/**
 * Register dynamic Python generator for extensions
 */
export function registerExtensionPythonGenerators(extensions: ProjectExtension[]): void {
  for (const ext of extensions) {
    if (!ext.blocksJson) continue;
    for (const blockDef of ext.blocksJson) {
      if (blockDef.python) {
        pythonGenerator.forBlock[blockDef.type] = function (block) {
          let tmpl = blockDef.python;
          if (blockDef.args0) {
            blockDef.args0.forEach((arg: any) => {
              const name = arg.name;
              let val = '';
              if (arg.type === 'input_value') {
                val = pythonGenerator.valueToCode(block, name, Order.NONE) || '0';
              } else {
                val = block.getFieldValue(name) ?? '';
              }
              tmpl = tmpl.replaceAll(`{${name}}`, val);
            });
          }
          if (blockDef.output) {
            return [tmpl, Order.FUNCTION_CALL];
          }
          return `${tmpl}\n`;
        };
      }
    }
  }
}

/**
 * Generate complete Python code conforming to the MB2ESP / pixl.py specification
 */
export function generatePythonCode(workspace: Blockly.Workspace, extensions: ProjectExtension[] = []): string {
  registerPythonGenerators();
  registerExtensionPythonGenerators(extensions);

  const topBlocks = workspace.getTopBlocks(true);

  // Group blocks by type - only recognized top-level event/loop/start containers are included
  let onStartCode = '';
  let eventCode = '';
  let foreverCode = '';

  for (const block of topBlocks) {
    if (!block.isEnabled()) continue;

    const type = block.type;
    if (type === 'mb_on_start') {
      const inner = pythonGenerator.statementToCode(block, 'DO');
      if (inner && inner.trim()) {
        // Strip 2 spaces of indentation for top-level on_start statements
        const unindented = inner
          .split('\n')
          .map(line => line.startsWith('  ') ? line.slice(2) : line)
          .join('\n');
        onStartCode += unindented;
      }
    } else if (type === 'mb_forever') {
      foreverCode += pythonGenerator.blockToCode(block);
    } else if (type === 'mb_on_button_pressed') {
      eventCode += pythonGenerator.blockToCode(block);
    }
    // Loose blocks outside on_start, forever, or event blocks are discarded and do not execute
  }

  const allUserCode = onStartCode + eventCode + foreverCode;
  const sections: string[] = ['from pixl import *'];

  if (allUserCode.includes('led.brightness')) {
    sections.push(`
# Safe LED brightness compatibility for boards
if not hasattr(led, 'brightness'):
    def _b(v):
        led._b = max(0, min(255, int(v)))
        if hasattr(led, '_rgb') and led._rgb != (0, 0, 0):
            r, g, b = led._rgb
            s = led._b / 255.0
            led._oc(int(r * s), int(g * s), int(b * s))
    def _c(r, g, b):
        led._rgb = (int(r), int(g), int(b))
        s = getattr(led, '_b', 255) / 255.0
        led._oc(int(r * s), int(g * s), int(b * s))
    def _off():
        led._rgb = (0, 0, 0)
        if callable(getattr(led, '_ooff', None)):
            led._ooff()
        else:
            led._oc(0, 0, 0)
    led._oc = led.color
    led._ooff = getattr(led, 'off', None)
    led.color = _c
    led.brightness = _b
    led.off = _off`);
  }

  if (onStartCode.trim()) {
    sections.push('\n# on start\n' + onStartCode.trimEnd());
  }

  if (eventCode.trim()) {
    sections.push('\n' + eventCode.trimEnd());
  }

  if (foreverCode.trim()) {
    sections.push('\n' + foreverCode.trimEnd());
  }

  sections.push('\nrun()  # always the last line\n');

  return sections.join('\n');
}
