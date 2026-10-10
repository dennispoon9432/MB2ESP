import * as Blockly from 'blockly';
import { ProjectExtension } from '../types/project';
import { DIGITAL_PIN_OPTIONS, ANALOG_PIN_OPTIONS } from '../board/pinMap';

export const COLOR_BASIC = '#1E90FF';
export const COLOR_INPUT = '#D400D4';
export const COLOR_DISPLAY = '#00A4A6';
export const COLOR_PINS = '#B22222';
export const COLOR_LOOPS = '#00AA00';
export const COLOR_LOGIC = '#00A4A6';
export const COLOR_VARIABLES = '#DC143C';
export const COLOR_MATH = '#9400D3';
export const COLOR_EXTENSIONS = '#708090';

export function registerAllBlocks(): void {
  // === BASIC CATEGORY (#1E90FF) ===

  Blockly.Blocks['mb_on_start'] = {
    init: function () {
      this.appendDummyInput().appendField('on start');
      this.appendStatementInput('DO');
      this.setColour(COLOR_BASIC);
      this.setTooltip('Runs once when the board starts up');
      this.setDeletable(true);
    }
  };

  Blockly.Blocks['mb_forever'] = {
    init: function () {
      this.appendDummyInput().appendField('forever');
      this.appendStatementInput('DO');
      this.setColour(COLOR_BASIC);
      this.setTooltip('Repeats code in a continuous loop');
      this.setDeletable(true);
    }
  };

  Blockly.Blocks['mb_pause'] = {
    init: function () {
      this.appendValueInput('MS')
        .setCheck('Number')
        .appendField('pause (ms)');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_BASIC);
      this.setTooltip('Pause the program for the specified number of milliseconds');
    }
  };

  // === INPUT CATEGORY (#D400D4) ===

  Blockly.Blocks['mb_on_button_pressed'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('on button')
        .appendField(
          new Blockly.FieldDropdown([
            ['A', 'A'],
            ['B', 'B'],
            ['A + B', 'AB']
          ]),
          'BUTTON'
        )
        .appendField('pressed');
      this.appendStatementInput('DO');
      this.setColour(COLOR_INPUT);
      this.setTooltip('Runs when the specified button is clicked');
    }
  };

  Blockly.Blocks['mb_button_is_pressed'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('button')
        .appendField(
          new Blockly.FieldDropdown([
            ['A', 'A'],
            ['B', 'B']
          ]),
          'BUTTON'
        )
        .appendField('is pressed');
      this.setOutput(true, 'Boolean');
      this.setColour(COLOR_INPUT);
      this.setTooltip('Returns true if the button is currently being held down');
    }
  };

  Blockly.Blocks['mb_running_time'] = {
    init: function () {
      this.appendDummyInput().appendField('running time (ms)');
      this.setOutput(true, 'Number');
      this.setColour(COLOR_INPUT);
      this.setTooltip('Get the number of milliseconds since the board started up');
    }
  };

  // === DISPLAY / OLED CATEGORY (#00A4A6) ===

  Blockly.Blocks['mb_oled_show_text'] = {
    init: function () {
      this.appendValueInput('TEXT')
        .setCheck(null)
        .appendField('oled show text');
      this.appendValueInput('X')
        .setCheck('Number')
        .appendField('at x');
      this.appendValueInput('Y')
        .setCheck('Number')
        .appendField('y');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_DISPLAY);
      this.setTooltip('Draw text on 128x64 OLED at pixel coordinate (x, y)');
    }
  };

  Blockly.Blocks['mb_oled_show_number'] = {
    init: function () {
      this.appendValueInput('NUMBER')
        .setCheck('Number')
        .appendField('oled show number');
      this.appendValueInput('X')
        .setCheck('Number')
        .appendField('at x');
      this.appendValueInput('Y')
        .setCheck('Number')
        .appendField('y');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_DISPLAY);
      this.setTooltip('Draw number on 128x64 OLED at pixel coordinate (x, y)');
    }
  };

  Blockly.Blocks['mb_oled_draw_line'] = {
    init: function () {
      this.appendDummyInput().appendField('oled draw line');
      this.appendValueInput('X1').setCheck('Number').appendField('from x1');
      this.appendValueInput('Y1').setCheck('Number').appendField('y1');
      this.appendValueInput('X2').setCheck('Number').appendField('to x2');
      this.appendValueInput('Y2').setCheck('Number').appendField('y2');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_DISPLAY);
      this.setTooltip('Draw line between two coordinates on OLED (0-127, 0-63)');
    }
  };

  Blockly.Blocks['mb_oled_draw_rect'] = {
    init: function () {
      this.appendDummyInput().appendField('oled draw rect');
      this.appendValueInput('X').setCheck('Number').appendField('x');
      this.appendValueInput('Y').setCheck('Number').appendField('y');
      this.appendValueInput('W').setCheck('Number').appendField('w');
      this.appendValueInput('H').setCheck('Number').appendField('h');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_DISPLAY);
      this.setTooltip('Draw rectangle on OLED at (x, y) with width and height');
    }
  };

  Blockly.Blocks['mb_oled_clear'] = {
    init: function () {
      this.appendDummyInput().appendField('oled clear');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_DISPLAY);
      this.setTooltip('Clear all graphics and text from the OLED screen');
    }
  };

  // === PINS CATEGORY (#B22222) ===

  Blockly.Blocks['mb_digital_write_pin'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('digital write pin')
        .appendField(new Blockly.FieldDropdown(DIGITAL_PIN_OPTIONS), 'PIN')
        .appendField('to');
      this.appendValueInput('VALUE')
        .setCheck('Number');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_PINS);
      this.setTooltip('Set digital pin output to 0 (LOW) or 1 (HIGH). Usable pins: GPIO 1, 2, 4, 5, 6, 7, 10, 11, 12, 15, 16, 17.');
    }
  };

  Blockly.Blocks['mb_digital_read_pin'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('digital read pin')
        .appendField(new Blockly.FieldDropdown(DIGITAL_PIN_OPTIONS), 'PIN');
      this.setOutput(true, 'Number');
      this.setColour(COLOR_PINS);
      this.setTooltip('Read digital value (0 or 1) from GPIO pin. Usable pins: GPIO 1, 2, 4, 5, 6, 7, 10, 11, 12, 15, 16, 17.');
    }
  };

  Blockly.Blocks['mb_analog_read_pin'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('analog read pin')
        .appendField(new Blockly.FieldDropdown(ANALOG_PIN_OPTIONS), 'PIN');
      this.setOutput(true, 'Number');
      this.setColour(COLOR_PINS);
      this.setTooltip('Read analog voltage (0 to 1023) from GPIO pin. GPIO 1, 2, 4, 5, 6, 7, 10 always work; GPIO 11, 12, 15, 16, 17 do not work while Wi-Fi is on.');
    }
  };

  Blockly.Blocks['mb_analog_write_pin'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('analog write pin')
        .appendField(new Blockly.FieldDropdown(DIGITAL_PIN_OPTIONS), 'PIN')
        .appendField('to');
      this.appendValueInput('VALUE')
        .setCheck('Number');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_PINS);
      this.setTooltip('Write PWM analog value (0 to 1023) to GPIO pin.');
    }
  };

  Blockly.Blocks['mb_servo_write_pin'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('servo write pin')
        .appendField(new Blockly.FieldDropdown(DIGITAL_PIN_OPTIONS), 'PIN')
        .appendField('to angle');
      this.appendValueInput('ANGLE')
        .setCheck('Number');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_PINS);
      this.setTooltip('Rotate servo motor on GPIO pin to specified angle (0 to 180 degrees). Usable pins: GPIO 1, 2, 4, 5, 6, 7, 10, 11, 12, 15, 16, 17.');
    }
  };

  // === LOOPS CATEGORY (#00AA00) ===

  Blockly.Blocks['mb_repeat'] = {
    init: function () {
      this.appendValueInput('TIMES')
        .setCheck('Number')
        .appendField('repeat');
      this.appendDummyInput().appendField('times');
      this.appendStatementInput('DO').appendField('do');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_LOOPS);
      this.setTooltip('Repeat actions a number of times');
    }
  };

  Blockly.Blocks['mb_while'] = {
    init: function () {
      this.appendValueInput('BOOL')
        .setCheck('Boolean')
        .appendField('while');
      this.appendStatementInput('DO').appendField('do');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_LOOPS);
      this.setTooltip('Repeat actions while condition is true');
    }
  };

  Blockly.Blocks['mb_for_index'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('for index from')
        .appendField(new Blockly.FieldNumber(0), 'FROM')
        .appendField('to')
        .appendField(new Blockly.FieldNumber(4), 'TO');
      this.appendStatementInput('DO').appendField('do');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_LOOPS);
      this.setTooltip('Count through a sequence of numbers');
    }
  };

  // === LOGIC CATEGORY (#00A4A6) ===

  Blockly.Blocks['mb_if'] = {
    init: function () {
      this.appendValueInput('IF0')
        .setCheck('Boolean')
        .appendField('if');
      this.appendStatementInput('DO0')
        .appendField('then');
      this.appendStatementInput('ELSE')
        .appendField('else');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_LOGIC);
      this.setTooltip('If condition is met, execute then block, otherwise else');
    }
  };

  Blockly.Blocks['mb_compare'] = {
    init: function () {
      this.appendValueInput('A');
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ['=', 'EQ'],
            ['≠', 'NEQ'],
            ['<', 'LT'],
            ['≤', 'LTE'],
            ['>', 'GT'],
            ['≥', 'GTE']
          ]),
          'OP'
        );
      this.appendValueInput('B');
      this.setInputsInline(true);
      this.setOutput(true, 'Boolean');
      this.setColour(COLOR_LOGIC);
      this.setTooltip('Compare two values');
    }
  };

  Blockly.Blocks['mb_and_or'] = {
    init: function () {
      this.appendValueInput('A').setCheck('Boolean');
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ['and', 'AND'],
            ['or', 'OR']
          ]),
          'OP'
        );
      this.appendValueInput('B').setCheck('Boolean');
      this.setInputsInline(true);
      this.setOutput(true, 'Boolean');
      this.setColour(COLOR_LOGIC);
      this.setTooltip('Logical AND / OR');
    }
  };

  Blockly.Blocks['mb_not'] = {
    init: function () {
      this.appendValueInput('BOOL')
        .setCheck('Boolean')
        .appendField('not');
      this.setOutput(true, 'Boolean');
      this.setColour(COLOR_LOGIC);
      this.setTooltip('Invert a boolean condition');
    }
  };

  Blockly.Blocks['mb_boolean'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ['true', 'TRUE'],
            ['false', 'FALSE']
          ]),
          'BOOL'
        );
      this.setOutput(true, 'Boolean');
      this.setColour(COLOR_LOGIC);
      this.setTooltip('Boolean value');
    }
  };

  // === MATH CATEGORY (#9400D3) ===

  Blockly.Blocks['mb_math_number'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0), 'NUM');
      this.setOutput(true, 'Number');
      this.setColour(COLOR_MATH);
      this.setTooltip('A constant number');
    }
  };

  Blockly.Blocks['mb_math_arithmetic'] = {
    init: function () {
      this.appendValueInput('A').setCheck('Number');
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ['+', 'ADD'],
            ['-', 'MINUS'],
            ['×', 'MULTIPLY'],
            ['÷', 'DIVIDE'],
            ['^', 'POWER']
          ]),
          'OP'
        );
      this.appendValueInput('B').setCheck('Number');
      this.setInputsInline(true);
      this.setOutput(true, 'Number');
      this.setColour(COLOR_MATH);
      this.setTooltip('Math calculation');
    }
  };

  Blockly.Blocks['mb_math_random'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('pick random 0 to');
      this.appendValueInput('MAX')
        .setCheck('Number');
      this.setInputsInline(true);
      this.setOutput(true, 'Number');
      this.setColour(COLOR_MATH);
      this.setTooltip('Return random integer between 0 and maximum');
    }
  };

  Blockly.Blocks['mb_math_min_max'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ['min', 'MIN'],
            ['max', 'MAX']
          ]),
          'OP'
        )
        .appendField('of');
      this.appendValueInput('A').setCheck('Number');
      this.appendValueInput('B').setCheck('Number');
      this.setInputsInline(true);
      this.setOutput(true, 'Number');
      this.setColour(COLOR_MATH);
      this.setTooltip('Minimum or maximum of two values');
    }
  };

  Blockly.Blocks['mb_math_abs'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ['abs', 'ABS'],
            ['sqrt', 'SQRT']
          ]),
          'OP'
        );
      this.appendValueInput('NUM').setCheck('Number');
      this.setInputsInline(true);
      this.setOutput(true, 'Number');
      this.setColour(COLOR_MATH);
      this.setTooltip('Absolute value or square root');
    }
  };
}

/**
 * Register blocks from loaded project extensions
 */
export function registerExtensionBlocks(extensions: ProjectExtension[]): void {
  for (const ext of extensions) {
    if (!ext.blocksJson || !Array.isArray(ext.blocksJson)) continue;
    for (const blockDef of ext.blocksJson) {
      if (!Blockly.Blocks[blockDef.type]) {
        try {
          Blockly.defineBlocksWithJsonArray([blockDef]);
        } catch (e) {
          console.warn(`Could not register block ${blockDef.type}:`, e);
        }
      }
    }
  }
}
