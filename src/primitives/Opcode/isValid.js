// @ts-nocheck
import { INFO_TABLE } from "./infoTable.js";

/**
 * Check if opcode is valid
 *
 * @param {number} opcode - Byte value to check
 * @returns {opcode is import('./BrandedOpcode.js').BrandedOpcode} True if opcode is defined in the EVM
 *
 * @example
 * ```typescript
 * Opcode.isValid(0x01); // true (ADD)
 * Opcode.isValid(0x0c); // false (undefined)
 * ```
 */
export function isValid(opcode) {
	return INFO_TABLE.has(
		/** @type {import('./BrandedOpcode.js').BrandedOpcode} */ (opcode),
	);
}
