// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Check if opcode is a PUSH instruction
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to check
 * @returns {boolean} True if PUSH0-PUSH32
 *
 * @example
 * ```typescript
 * Opcode.isPush(Opcode.PUSH1); // true
 * Opcode.isPush(Opcode.ADD); // false
 * ```
 */
export function isPush(opcode) {
	return opcode === constants.PUSH0 || (opcode >= constants.PUSH1 && opcode <= constants.PUSH32);
}
