/**
 * MB2ESP / PIXL Pin Map Definition (ESP32-S3)
 * Real GPIO pin numbers: GPIO 1, 2, 4, 5, 6, 7, 10, 11, 12, 15, 16, 17
 * All 12 pins support digital, PWM (analog write) and servo.
 * All 12 pins support analog read (GPIO 1, 2, 4, 5, 6, 7, 10 always; 11, 12, 15, 16, 17 disabled during Wi-Fi).
 * I2C OLED uses GPIO 8 (SDA) and GPIO 9 (SCL) and are never in dropdowns.
 */

export interface PinDefinition {
  gpio: number;
  label: string; // "GPIO1", "GPIO2", ...
  supportsAnalog: boolean;
  analogAlwaysWorks: boolean; // GPIO 1, 2, 4, 5, 6, 7, 10 always work; 11, 12, 15, 16, 17 do not work while Wi-Fi is on
  description: string;
}

export const USABLE_GPIOS: readonly number[] = [1, 2, 4, 5, 6, 7, 10, 11, 12, 15, 16, 17];

export const MB2ESP_PINS: PinDefinition[] = [
  { gpio: 1, label: 'GPIO1', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO1 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 2, label: 'GPIO2', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO2 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 4, label: 'GPIO4', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO4 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 5, label: 'GPIO5', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO5 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 6, label: 'GPIO6', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO6 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 7, label: 'GPIO7', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO7 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 10, label: 'GPIO10', supportsAnalog: true, analogAlwaysWorks: true, description: 'GPIO10 (Digital, PWM, Servo, Analog ADC)' },
  { gpio: 11, label: 'GPIO11', supportsAnalog: true, analogAlwaysWorks: false, description: 'GPIO11 (Digital, PWM, Servo, Analog ADC - Wi-Fi shared)' },
  { gpio: 12, label: 'GPIO12', supportsAnalog: true, analogAlwaysWorks: false, description: 'GPIO12 (Digital, PWM, Servo, Analog ADC - Wi-Fi shared)' },
  { gpio: 15, label: 'GPIO15', supportsAnalog: true, analogAlwaysWorks: false, description: 'GPIO15 (Digital, PWM, Servo, Analog ADC - Wi-Fi shared)' },
  { gpio: 16, label: 'GPIO16', supportsAnalog: true, analogAlwaysWorks: false, description: 'GPIO16 (Digital, PWM, Servo, Analog ADC - Wi-Fi shared)' },
  { gpio: 17, label: 'GPIO17', supportsAnalog: true, analogAlwaysWorks: false, description: 'GPIO17 (Digital, PWM, Servo, Analog ADC - Wi-Fi shared)' },
];

export const OLED_I2C_PINS = {
  sda: 8,
  sdaLabel: 'GPIO8 (SDA)',
  scl: 9,
  sclLabel: 'GPIO9 (SCL)'
};

/**
 * Dropdown options for all 12 usable GPIO pins
 * Format: [['GPIO1', '1'], ['GPIO2', '2'], ...]
 */
export const DIGITAL_PIN_OPTIONS: [string, string][] = MB2ESP_PINS.map(p => [
  p.label,
  p.gpio.toString()
]);

/**
 * Dropdown options for analog pins (all 12 pins support analog read)
 */
export const ANALOG_PIN_OPTIONS: [string, string][] = MB2ESP_PINS.map(p => [
  p.label,
  p.gpio.toString()
]);

export function getPinDefinition(gpio: number): PinDefinition | undefined {
  return MB2ESP_PINS.find(p => p.gpio === gpio);
}

/**
 * Legacy micro:bit-style P0–P8 to real ESP32-S3 GPIO migration mapping:
 * P0→1, P1→2, P2→4, P3→5, P4→6, P5→7, P6→15, P7→16, P8→17
 */
export const LEGACY_PIN_TO_GPIO_MAP: Record<string, string> = {
  '0': '1',
  '1': '2',
  '2': '4',
  '3': '5',
  '4': '6',
  '5': '7',
  '6': '15',
  '7': '16',
  '8': '17',
  'P0': '1',
  'P1': '2',
  'P2': '4',
  'P3': '5',
  'P4': '6',
  'P5': '7',
  'P6': '15',
  'P7': '16',
  'P8': '17',
};
