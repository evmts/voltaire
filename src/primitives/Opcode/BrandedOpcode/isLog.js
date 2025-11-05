// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Check if opcode is a LOG instruction
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to check
 * @returns {boolean} True if LOG0-LOG4
 *
 * @example
 * ```typescript
 * Opcode.isLog(Opcode.LOG1); // true
 * Opcode.isLog(Opcode.ADD); // false
 * ```
 */
export function isLog(opcode) {
	return opcode >= constants.LOG0 && opcode <= constants.LOG4;
}
