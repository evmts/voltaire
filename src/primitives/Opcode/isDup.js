// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Check if opcode is a DUP instruction
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to check
 * @returns {boolean} True if DUP1-DUP16
 *
 * @example
 * ```typescript
 * Opcode.isDup(Opcode.DUP1); // true
 * Opcode.isDup(Opcode.ADD); // false
 * ```
 */
export function isDup(opcode) {
	return opcode >= constants.DUP1 && opcode <= constants.DUP16;
}
