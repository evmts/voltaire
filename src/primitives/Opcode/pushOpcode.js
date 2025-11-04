// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Get PUSH opcode for given byte count
 *
 * @param {number} bytes - Number of bytes (0-32)
 * @returns {import('./BrandedOpcode.js').BrandedOpcode} PUSH opcode for that size
 * @throws {Error} If bytes is not 0-32
 *
 * @example
 * ```typescript
 * Opcode.pushOpcode(1); // Opcode.PUSH1
 * Opcode.pushOpcode(32); // Opcode.PUSH32
 * Opcode.pushOpcode(0); // Opcode.PUSH0
 * ```
 */
export function pushOpcode(bytes) {
	if (bytes === 0) return constants.PUSH0;
	if (bytes < 1 || bytes > 32) {
		throw new Error(`Invalid PUSH size: ${bytes} (must be 0-32)`);
	}
	return /** @type {import('./BrandedOpcode.js').BrandedOpcode} */ (constants.PUSH1 + bytes - 1);
}
