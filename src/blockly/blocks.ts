import * as Blockly from 'blockly';
import { Field5x5Led } from './Field5x5Led';
import { ProjectExtension } from '../types/project';

// Icon definitions
export const ICON_MAP: Record<string, string> = {
  HEART: '01010:11111:11111:01110:00100',
  SMALL_HEART: '00000:01010:01110:00100:00000',
  YES: '00000:00001:00010:10100:01000',
  NO: '10001:01010:00100:01010:10001',
  HAPPY: '00000:01010:00000:10001:01110',
  SAD: '00000:01010:00000:01110:10001',
  SURPRISED: '01010:00000:00100:01010:00100',
  SILLY: '10001:00000:11111:00001:01110',
  FABULOUS: '11111:10101:11111:10101:10101',
  MEH: '01010:00000:00010:00100:01000',
  TSHIRT: '11011:11111:01110:01110:01110',
  ROLLERSKATE: '00011:00011:11111:11111:01010',
  DUCK: '01100:11100:01111:01110:00000',
  HOUSE: '00100:01110:11111:01110:01010',
  TORTOISE: '00000:01110:11111:01010:00000',
  BUTTERFLY: '11011:11111:00100:11111:11011',
  STICKFIGURE: '00100:11111:00100:01010:10001',
  GHOST: '11111:10101:11111:11111:10101',
  SWORD: '00100:00100:00100:01110:00100',
  GIRAFFE: '11000:01000:01000:01110:01010',
  SKULL: '01110:10101:11111:01110:01110',
  PITCHFORK: '10101:10101:11111:00100:00100',
  TARGET: '00100:01110:11011:01110:00100',
  TRIANGLE: '00000:00100:01010:11111:00000',
  CHESSBOARD: '01010:10101:01010:10101:01010',
  DIAMOND: '00100:01010:10001:01010:00100',
  SMALL_DIAMOND: '00000:00100:01010:00100:00000',
  SQUARE: '11111:10001:10001:10001:11111',
  SMALL_SQUARE: '00000:01110:01010:01110:00000',
  PACMAN: '01110:11011:11100:11111:01110',
};

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

  Blockly.Blocks['mb_show_number'] = {
    init: function () {
      this.appendValueInput('NUMBER')
        .setCheck('Number')
        .appendField('show number');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_BASIC);
      this.setTooltip('Display a number on the screen');
    }
  };

  Blockly.Blocks['mb_show_leds'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('show leds')
        .appendField(new Field5x5Led(), 'LEDS');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_BASIC);
      this.setTooltip('Draw an image on the 5x5 LED matrix');
    }
  };

  Blockly.Blocks['mb_show_icon'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('show icon')
        .appendField(
          new Blockly.FieldDropdown([
            ['Heart', 'HEART'],
            ['Small Heart', 'SMALL_HEART'],
            ['Yes (Check)', 'YES'],
            ['No (Cross)', 'NO'],
            ['Happy', 'HAPPY'],
            ['Sad', 'SAD'],
            ['Surprised', 'SURPRISED'],
            ['Silly', 'SILLY'],
            ['Fabulous', 'FABULOUS'],
            ['Meh', 'MEH'],
            ['T-Shirt', 'TSHIRT'],
            ['Rollerskate', 'ROLLERSKATE'],
            ['Duck', 'DUCK'],
            ['House', 'HOUSE'],
            ['Tortoise', 'TORTOISE'],
            ['Butterfly', 'BUTTERFLY'],
            ['Stick Figure', 'STICKFIGURE'],
            ['Ghost', 'GHOST'],
            ['Sword', 'SWORD'],
            ['Giraffe', 'GIRAFFE'],
            ['Skull', 'SKULL'],
            ['Pitchfork', 'PITCHFORK'],
            ['Target', 'TARGET'],
            ['Triangle', 'TRIANGLE'],
            ['Chessboard', 'CHESSBOARD'],
            ['Diamond', 'DIAMOND'],
            ['Small Diamond', 'SMALL_DIAMOND'],
            ['Square', 'SQUARE'],
            ['Small Square', 'SMALL_SQUARE'],
            ['Pacman', 'PACMAN']
          ]),
          'ICON'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_BASIC);
      this.setTooltip('Show a pre-drawn icon on the screen');
    }
  };

  Blockly.Blocks['mb_show_string'] = {
    init: function () {
      this.appendValueInput('TEXT')
        .setCheck(null)
        .appendField('show string');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_BASIC);
      this.setTooltip('Scroll text across the screen');
    }
  };

  Blockly.Blocks['mb_clear_screen'] = {
    init: function () {
      this.appendDummyInput().appendField('clear screen');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_BASIC);
      this.setTooltip('Clear the LED screen');
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

  Blockly.Blocks['mb_plot'] = {
    init: function () {
      this.appendValueInput('X')
        .setCheck('Number')
        .appendField('plot x');
      this.appendValueInput('Y')
        .setCheck('Number')
        .appendField('y');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_DISPLAY);
      this.setTooltip('Turn on LED at (x, y) where coordinates are 0 to 4');
    }
  };

  Blockly.Blocks['mb_unplot'] = {
    init: function () {
      this.appendValueInput('X')
        .setCheck('Number')
        .appendField('unplot x');
      this.appendValueInput('Y')
        .setCheck('Number')
        .appendField('y');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_DISPLAY);
      this.setTooltip('Turn off LED at (x, y)');
    }
  };

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
      this.setTooltip('Draw line between two coordinates on OLED');
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
      this.setTooltip('Clear all OLED graphics');
    }
  };

  // === PINS CATEGORY (#B22222) ===

  const PIN_OPTIONS: [string, string][] = [
    ['P0', '0'],
    ['P1', '1'],
    ['P2', '2'],
    ['P3', '3'],
    ['P4', '4'],
    ['P5', '5'],
    ['P6', '6'],
    ['P7', '7'],
    ['P8', '8']
  ];

  Blockly.Blocks['mb_digital_write_pin'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('digital write pin')
        .appendField(new Blockly.FieldDropdown(PIN_OPTIONS), 'PIN')
        .appendField('to');
      this.appendValueInput('VALUE')
        .setCheck('Number');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_PINS);
      this.setTooltip('Set digital pin output to 0 (LOW) or 1 (HIGH)');
    }
  };

  Blockly.Blocks['mb_digital_read_pin'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('digital read pin')
        .appendField(new Blockly.FieldDropdown(PIN_OPTIONS), 'PIN');
      this.setOutput(true, 'Number');
      this.setColour(COLOR_PINS);
      this.setTooltip('Read digital value (0 or 1) from pin');
    }
  };

  Blockly.Blocks['mb_analog_read_pin'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('analog read pin')
        .appendField(new Blockly.FieldDropdown(PIN_OPTIONS), 'PIN');
      this.setOutput(true, 'Number');
      this.setColour(COLOR_PINS);
      this.setTooltip('Read analog voltage (0 to 1023) from pin');
    }
  };

  Blockly.Blocks['mb_servo_write_pin'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('servo write pin')
        .appendField(new Blockly.FieldDropdown(PIN_OPTIONS), 'PIN')
        .appendField('to angle');
      this.appendValueInput('ANGLE')
        .setCheck('Number');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(COLOR_PINS);
      this.setTooltip('Rotate servo motor on pin to specified angle (0 to 180 degrees)');
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
