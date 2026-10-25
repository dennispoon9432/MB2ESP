/**
 * PIXL Board Pin Map Definition (ESP32-S3)
 * Exact 10 user GPIO pins in order:
 * GPIO 1, 2, 4, 5, 6, 7, 10, 11, 12, 13
 * All 10 pins support digital, PWM (analog write) and servo.
 * Analog ADC: GPIO 1, 2, 4, 5, 6, 7, 10 always work; GPIO 11, 12, 13 do not work while Wi-Fi is on.
 * Servos: Plug into the 3-pin socket on GPIO4 (battery power for the motor).
 * GPIO 17 is internal (OLED reset). GPIO 15, 16, 17 removed from user pins.
 */

import * as Blockly from 'blockly';

export interface PinDefinition {
  gpio: number;
  label: string; // "GPIO1", "GPIO2", ...
  supportsAnalog: boolean;
  analogAlwaysWorks: boolean; // GPIO 1, 2, 4, 5, 6, 7, 10 always work; 11, 12, 13 disabled while Wi-Fi is on
  description: string;
}

export const USABLE_GPIOS: readonly number[] = [1, 2, 4, 5, 6, 7, 10, 11, 12, 13];
export const DEPRECATED_GPIOS: readonly string[] = ['15', '16', '17'];

export const PIXL_PINS: PinDefinition[] = [
  { gpio: 1, label: 'GPIO1', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO1 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 2, label: 'GPIO2', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO2 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 4, label: 'GPIO4', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO4 (Digital, PWM, Servo with battery power, Analog ADC)' },
  { gpio: 5, label: 'GPIO5', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO5 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 6, label: 'GPIO6', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO6 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 7, label: 'GPIO7', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO7 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 10, label: 'GPIO10', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO10 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 11, label: 'GPIO11', supportsAnalog: true, analogAlwaysWorks: false, description: 'GPIO11 (Digital, PWM, Servo, Analog ADC - Wi-Fi shared)' },
  { gpio: 12, label: 'GPIO12', supportsAnalog: true, analogAlwaysWorks: false, description: 'GPIO12 (Digital, PWM, Servo, Analog ADC - Wi-Fi shared)' },
  { gpio: 13, label: 'GPIO13', supportsAnalog: true, analogAlwaysWorks: false, description: 'GPIO13 (Digital, PWM, Servo, Analog ADC - Wi-Fi shared)' },
];

export const MB2ESP_PINS = PIXL_PINS; // alias for backwards compatibility

export const OLED_I2C_PINS = {
  sda: 8,
  sdaLabel: 'GPIO8 (SDA)',
  scl: 9,
  sclLabel: 'GPIO9 (SCL)',
  res: 17,
  resLabel: 'GPIO17 (OLED Reset)'
};

/**
 * Dropdown options for exactly the 10 usable GPIO pins
 * Format: [['GPIO1', '1'], ['GPIO2', '2'], ...]
 */
export const DIGITAL_PIN_OPTIONS: [string, string][] = PIXL_PINS.map(p => [
  p.label,
  p.gpio.toString()
]);

export const ANALOG_PIN_OPTIONS: [string, string][] = DIGITAL_PIN_OPTIONS;

/**
 * Custom PinDropdown class that validates against the 10 pins,
 * but allows legacy projects with GPIO15/16/17 to load without failing.
 */
export class PinDropdown extends Blockly.FieldDropdown {
  protected override doClassValidation_(newValue?: string) {
    if (newValue && DEPRECATED_GPIOS.includes(String(newValue))) {
      return newValue;
    }
    return super.doClassValidation_(newValue);
  }

  public override getText(): string {
    const val = String(this.getValue());
    if (DEPRECATED_GPIOS.includes(val)) {
      return `GPIO${val} (Unavailable)`;
    }
    return super.getText();
  }
}

export function getPinDefinition(gpio: number): PinDefinition | undefined {
  return PIXL_PINS.find(p => p.gpio === gpio);
}

/**
 * Legacy micro:bit-style P0–P8 to real ESP32-S3 GPIO migration mapping:
 * P0→1, P1→2, P2→4, P3→5, P4→6, P5→7, P6→10, P7→11, P8→12
 */
export const LEGACY_PIN_TO_GPIO_MAP: Record<string, string> = {
  '0': '1',
  '1': '2',
  '2': '4',
  '3': '5',
  '4': '6',
  '5': '7',
  '6': '10',
  '7': '11',
  '8': '12',
  'P0': '1',
  'P1': '2',
  'P2': '4',
  'P3': '5',
  'P4': '6',
  'P5': '7',
  'P6': '10',
  'P7': '11',
  'P8': '12',
};
