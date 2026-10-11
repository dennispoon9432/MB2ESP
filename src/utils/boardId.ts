/**
 * Utility functions for PIXL Board ID in classroom environments.
 * 
 * Board IDs are 6 uppercase hex characters displayed on the board's screen,
 * e.g. "A96E08".
 */

export const BOARD_ID_STORAGE_KEY = 'pixl_classroom_board_id';

/**
 * Clean student input:
 * - Remove spaces and dashes
 * - Convert to uppercase
 * - Replace letter 'O' with digit '0'
 * - Truncate to at most 6 characters
 */
export function cleanBoardId(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[\s\-]/g, '')
    .toUpperCase()
    .replace(/O/g, '0')
    .slice(0, 6);
}

/**
 * Valid Board ID must be exactly 6 characters, each 0-9 or A-F.
 */
export function isValidBoardId(id: string): boolean {
  return /^[0-9A-F]{6}$/.test(id);
}

/**
 * Load saved board ID from localStorage
 */
export function loadSavedBoardId(): string {
  try {
    const saved = localStorage.getItem(BOARD_ID_STORAGE_KEY);
    if (saved) {
      const cleaned = cleanBoardId(saved);
      if (isValidBoardId(cleaned)) {
        return cleaned;
      }
    }
  } catch (e) {
    console.warn('Failed to load board ID from localStorage', e);
  }
  return '';
}

/**
 * Persist valid board ID to localStorage
 */
export function persistBoardId(id: string): void {
  try {
    const cleaned = cleanBoardId(id);
    if (isValidBoardId(cleaned)) {
      localStorage.setItem(BOARD_ID_STORAGE_KEY, cleaned);
    }
  } catch (e) {
    console.warn('Failed to save board ID to localStorage', e);
  }
}
