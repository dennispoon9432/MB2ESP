/**
 * MB2ESP Pin Map Definition (ESP32-S3)
 * Mapping between logical MB2ESP P-numbers (P0-P8) and physical ESP32-S3 GPIO pins.
 * Mapping is performed on-board via pixl.py pin_gpio(p).
 */

export interface PinDefinition {
  pinNumber: number; // 0 to 8
  pinLabel: string; // "P0" to "P8"
  gpio: number; // Physical ESP32-S3 GPIO number
  gpioLabel: string; // "GPIO1", etc.
  isAnalog: boolean;
  description: string;
}

export const MB2ESP_PINS: PinDefinition[] = [
  { pinNumber: 0, pinLabel: 'P0', gpio: 1, gpioLabel: 'GPIO1', isAnalog: true, description: 'P0 / GPIO1 (Analog & Digital)' },
  { pinNumber: 1, pinLabel: 'P1', gpio: 2, gpioLabel: 'GPIO2', isAnalog: true, description: 'P1 / GPIO2 (Analog & Digital)' },
  { pinNumber: 2, pinLabel: 'P2', gpio: 4, gpioLabel: 'GPIO4', isAnalog: true, description: 'P2 / GPIO4 (Analog & Digital)' },
  { pinNumber: 3, pinLabel: 'P3', gpio: 5, gpioLabel: 'GPIO5', isAnalog: true, description: 'P3 / GPIO5 (Analog & Digital)' },
  { pinNumber: 4, pinLabel: 'P4', gpio: 6, gpioLabel: 'GPIO6', isAnalog: true, description: 'P4 / GPIO6 (Analog & Digital)' },
  { pinNumber: 5, pinLabel: 'P5', gpio: 7, gpioLabel: 'GPIO7', isAnalog: true, description: 'P5 / GPIO7 (Analog & Digital)' },
  { pinNumber: 6, pinLabel: 'P6', gpio: 15, gpioLabel: 'GPIO15', isAnalog: false, description: 'P6 / GPIO15 (Digital)' },
  { pinNumber: 7, pinLabel: 'P7', gpio: 16, gpioLabel: 'GPIO16', isAnalog: false, description: 'P7 / GPIO16 (Digital)' },
  { pinNumber: 8, pinLabel: 'P8', gpio: 17, gpioLabel: 'GPIO17', isAnalog: false, description: 'P8 / GPIO17 (Digital)' },
];

export const OLED_I2C_PINS = {
  sda: 8,
  sdaLabel: 'GPIO8 (SDA)',
  scl: 9,
  sclLabel: 'GPIO9 (SCL)'
};

/**
 * Dropdown options for all general digital pins P0-P8
 * Format: [['P0 (GPIO1)', '0'], ...]
 */
export const DIGITAL_PIN_OPTIONS: [string, string][] = MB2ESP_PINS.map(p => [
  `${p.pinLabel} (${p.gpioLabel})`,
  p.pinNumber.toString()
]);

/**
 * Dropdown options for analog pins: only P0-P5
 * Format: [['P0 (GPIO1)', '0'], ...]
 */
export const ANALOG_PIN_OPTIONS: [string, string][] = MB2ESP_PINS
  .filter(p => p.isAnalog)
  .map(p => [
    `${p.pinLabel} (${p.gpioLabel})`,
    p.pinNumber.toString()
  ]);

export function getPinDefinition(pinNum: number): PinDefinition | undefined {
  return MB2ESP_PINS.find(p => p.pinNumber === pinNum);
}
