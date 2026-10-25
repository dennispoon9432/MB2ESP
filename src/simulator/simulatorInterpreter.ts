import * as Blockly from 'blockly';
import { MB2ESPSimulator } from './MB2ESPSimulator';

/**
 * Executes a Blockly block statement asynchronously on the MB2ESPSimulator
 */
export async function runBlockStatement(
  block: Blockly.Block | null,
  sim: MB2ESPSimulator,
  vars: Record<string, any>
): Promise<void> {
  let curr = block;
  while (curr) {
    if (sim.getAbortSignal()?.aborted) return;

    if (curr.isEnabled()) {
      try {
        await executeSingleBlock(curr, sim, vars);
      } catch (e: any) {
        if (e?.message === 'SIMULATION_STOPPED') return;
        console.warn('Block execution error:', e);
      }
    }

    curr = curr.getNextBlock();
  }
}

/**
 * Evaluate an expression block to a value
 */
export function evalBlockValue(
  block: Blockly.Block | null,
  sim: MB2ESPSimulator,
  vars: Record<string, any>
): any {
  if (!block) return 0;
  const type = block.type;

  switch (type) {
    case 'mb_math_number':
      return parseFloat(block.getFieldValue('NUM')) || 0;

    case 'text':
      return block.getFieldValue('TEXT') || '';

    case 'mb_running_time':
      return sim.runningTime();

    case 'mb_button_is_pressed': {
      const btn = (block.getFieldValue('BUTTON') || 'A') as 'A' | 'B' | 'X' | 'Y';
      return sim.isButtonPressed(btn);
    }

    case 'mb_digital_read_pin': {
      const pin = parseInt(block.getFieldValue('PIN') || '1', 10);
      return sim.pinRead(pin);
    }

    case 'mb_analog_read_pin': {
      const pin = parseInt(block.getFieldValue('PIN') || '1', 10);
      return sim.analogRead(pin);
    }

    case 'mb_math_arithmetic': {
      const a = evalInputValue(block, 'A', sim, vars, 0);
      const b = evalInputValue(block, 'B', sim, vars, 0);
      const op = block.getFieldValue('OP');
      if (op === 'ADD') return a + b;
      if (op === 'MINUS') return a - b;
      if (op === 'MULTIPLY') return a * b;
      if (op === 'DIVIDE') return b !== 0 ? a / b : 0;
      if (op === 'POWER') return Math.pow(a, b);
      return a + b;
    }

    case 'mb_math_random': {
      const max = evalInputValue(block, 'MAX', sim, vars, 10);
      return Math.floor(Math.random() * (max + 1));
    }

    case 'mb_math_min_max': {
      const a = evalInputValue(block, 'A', sim, vars, 0);
      const b = evalInputValue(block, 'B', sim, vars, 0);
      const op = block.getFieldValue('OP');
      return op === 'MAX' ? Math.max(a, b) : Math.min(a, b);
    }

    case 'mb_math_abs': {
      const num = evalInputValue(block, 'NUM', sim, vars, 0);
      const op = block.getFieldValue('OP');
      return op === 'SQRT' ? Math.sqrt(Math.max(0, num)) : Math.abs(num);
    }

    case 'mb_compare': {
      const a = evalInputValue(block, 'A', sim, vars, 0);
      const b = evalInputValue(block, 'B', sim, vars, 0);
      const op = block.getFieldValue('OP');
      if (op === 'EQ') return a == b;
      if (op === 'NEQ') return a != b;
      if (op === 'LT') return a < b;
      if (op === 'LTE') return a <= b;
      if (op === 'GT') return a > b;
      if (op === 'GTE') return a >= b;
      return false;
    }

    case 'mb_and_or': {
      const a = evalInputValue(block, 'A', sim, vars, false);
      const b = evalInputValue(block, 'B', sim, vars, false);
      const op = block.getFieldValue('OP');
      return op === 'OR' ? Boolean(a || b) : Boolean(a && b);
    }

    case 'mb_not': {
      const boolVal = evalInputValue(block, 'BOOL', sim, vars, false);
      return !boolVal;
    }

    case 'mb_boolean': {
      return block.getFieldValue('BOOL') === 'TRUE';
    }

    case 'variables_get': {
      const varId = block.getFieldValue('VAR');
      return vars[varId] ?? 0;
    }

    default:
      return 0;
  }
}

function evalInputValue(
  block: Blockly.Block,
  inputName: string,
  sim: MB2ESPSimulator,
  vars: Record<string, any>,
  defaultValue: any
): any {
  const target = block.getInputTargetBlock(inputName);
  if (!target) return defaultValue;
  return evalBlockValue(target, sim, vars);
}

/**
 * Execute a single block statement
 */
async function executeSingleBlock(
  block: Blockly.Block,
  sim: MB2ESPSimulator,
  vars: Record<string, any>
): Promise<void> {
  const type = block.type;

  switch (type) {
    case 'mb_oled_show_text': {
      const text = evalInputValue(block, 'TEXT', sim, vars, '');
      const x = evalInputValue(block, 'X', sim, vars, 0);
      const y = evalInputValue(block, 'Y', sim, vars, 0);
      sim.oledText(String(text), Number(x), Number(y));
      break;
    }

    case 'mb_oled_show_number': {
      const num = evalInputValue(block, 'NUMBER', sim, vars, 0);
      const x = evalInputValue(block, 'X', sim, vars, 0);
      const y = evalInputValue(block, 'Y', sim, vars, 0);
      sim.oledText(String(num), Number(x), Number(y));
      break;
    }

    case 'mb_oled_draw_line': {
      const x1 = evalInputValue(block, 'X1', sim, vars, 0);
      const y1 = evalInputValue(block, 'Y1', sim, vars, 0);
      const x2 = evalInputValue(block, 'X2', sim, vars, 0);
      const y2 = evalInputValue(block, 'Y2', sim, vars, 0);
      sim.oledLine(Number(x1), Number(y1), Number(x2), Number(y2));
      break;
    }

    case 'mb_oled_draw_rect': {
      const x = evalInputValue(block, 'X', sim, vars, 0);
      const y = evalInputValue(block, 'Y', sim, vars, 0);
      const w = evalInputValue(block, 'W', sim, vars, 10);
      const h = evalInputValue(block, 'H', sim, vars, 10);
      sim.oledRect(Number(x), Number(y), Number(w), Number(h));
      break;
    }

    case 'mb_oled_clear': {
      sim.oledClear();
      break;
    }

    case 'mb_led_set_color': {
      const raw = block.getFieldValue('COLOR') || '#ff8800';
      const hex = raw.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      sim.ledSetColor(r, g, b);
      break;
    }

    case 'mb_led_set_rgb': {
      const r = evalInputValue(block, 'R', sim, vars, 255);
      const g = evalInputValue(block, 'G', sim, vars, 0);
      const b = evalInputValue(block, 'B', sim, vars, 0);
      sim.ledSetColor(Number(r), Number(g), Number(b));
      break;
    }

    case 'mb_led_off': {
      sim.ledOff();
      break;
    }

    case 'mb_pause': {
      const ms = evalInputValue(block, 'MS', sim, vars, 100);
      await sim.pause(Math.max(10, ms));
      break;
    }

    case 'mb_digital_write_pin': {
      const pin = parseInt(block.getFieldValue('PIN') || '1', 10);
      const val = evalInputValue(block, 'VALUE', sim, vars, 0);
      sim.pinWrite(pin, val);
      break;
    }

    case 'mb_analog_write_pin': {
      const pin = parseInt(block.getFieldValue('PIN') || '1', 10);
      const val = evalInputValue(block, 'VALUE', sim, vars, 512);
      sim.analogWrite(pin, val);
      break;
    }

    case 'mb_servo_write_pin': {
      const pin = parseInt(block.getFieldValue('PIN') || '1', 10);
      const angle = evalInputValue(block, 'ANGLE', sim, vars, 90);
      sim.servo(pin, angle);
      break;
    }

    case 'mb_repeat': {
      const count = evalInputValue(block, 'TIMES', sim, vars, 4);
      const doBlock = block.getInputTargetBlock('DO');
      for (let i = 0; i < count; i++) {
        if (sim.getAbortSignal()?.aborted) break;
        await runBlockStatement(doBlock, sim, vars);
        await sim.pause(5);
      }
      break;
    }

    case 'mb_while': {
      const doBlock = block.getInputTargetBlock('DO');
      let safetyCounter = 0;
      while (evalInputValue(block, 'BOOL', sim, vars, false)) {
        if (sim.getAbortSignal()?.aborted) break;
        await runBlockStatement(doBlock, sim, vars);
        await sim.pause(10);
        safetyCounter++;
        if (safetyCounter > 5000) break;
      }
      break;
    }

    case 'mb_for_index': {
      const fromVal = parseFloat(block.getFieldValue('FROM')) || 0;
      const toVal = parseFloat(block.getFieldValue('TO')) || 4;
      const doBlock = block.getInputTargetBlock('DO');
      for (let i = fromVal; i <= toVal; i++) {
        if (sim.getAbortSignal()?.aborted) break;
        vars['index'] = i;
        await runBlockStatement(doBlock, sim, vars);
        await sim.pause(5);
      }
      break;
    }

    case 'mb_if': {
      const cond = evalInputValue(block, 'IF0', sim, vars, false);
      if (cond) {
        const doBlock = block.getInputTargetBlock('DO0');
        await runBlockStatement(doBlock, sim, vars);
      } else {
        const elseBlock = block.getInputTargetBlock('ELSE');
        if (elseBlock) {
          await runBlockStatement(elseBlock, sim, vars);
        }
      }
      break;
    }

    case 'variables_set': {
      const varId = block.getFieldValue('VAR');
      const val = evalInputValue(block, 'VALUE', sim, vars, 0);
      vars[varId] = val;
      break;
    }

    default:
      break;
  }
}

/**
 * Top-level program starter for the Blockly workspace
 */
export async function executeWorkspace(workspace: Blockly.Workspace, sim: MB2ESPSimulator): Promise<void> {
  const signal = sim.prepareNewRun();
  const vars: Record<string, any> = {};

  const topBlocks = workspace.getTopBlocks(true);
  const onStartBlock = topBlocks.find(b => b.type === 'mb_on_start' && b.isEnabled());
  const foreverBlock = topBlocks.find(b => b.type === 'mb_forever' && b.isEnabled());
  const buttonBlocks = topBlocks.filter(b => b.type === 'mb_on_button_pressed' && b.isEnabled());

  // 1. Register Button handlers
  for (const btnBlock of buttonBlocks) {
    const btn = (btnBlock.getFieldValue('BUTTON') || 'A') as 'A' | 'B' | 'X' | 'Y' | 'AB';
    const doBlock = btnBlock.getInputTargetBlock('DO');
    sim.registerButtonHandler(btn, async () => {
      await runBlockStatement(doBlock, sim, { ...vars });
    });
  }

  // 2. Run 'on start'
  if (onStartBlock) {
    const startDo = onStartBlock.getInputTargetBlock('DO');
    await runBlockStatement(startDo, sim, vars);
  }

  // 3. Run 'forever' loop continuously
  if (foreverBlock) {
    const foreverDo = foreverBlock.getInputTargetBlock('DO');
    (async () => {
      while (!signal.aborted) {
        try {
          await runBlockStatement(foreverDo, sim, vars);
          await sim.pause(30); // cooperative yield between loop iterations
        } catch (e: any) {
          if (e?.message === 'SIMULATION_STOPPED') break;
          console.warn('Forever loop exception:', e);
          break;
        }
      }
    })();
  }
}
