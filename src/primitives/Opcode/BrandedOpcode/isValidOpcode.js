// @ts-nocheck
import { INFO_TABLE } from "./infoTable.js";

/**
 * Check if value is a valid opcode (alias for isValid)
 *
 * @param {number} value - Value to check
 * @returns {boolean} True if valid opcode
 *
 * @example
 * ```typescript
 * Opcode.isValidOpcode(0x01); // true (ADD)
 * Opcode.isValidOpcode(0xFF); // true (SELFDESTRUCT)
 * Opcode.isValidOpcode(0x0C); // false
 * ```
 */
export function isValidOpcode(value) {
	return INFO_TABLE.has(
		/** @type {import('./BrandedOpcode.js').BrandedOpcode} */ (value),
	);
}
