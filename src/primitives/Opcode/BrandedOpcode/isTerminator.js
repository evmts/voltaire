// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Check if opcode terminates execution (alias for isTerminating)
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to check
 * @returns {boolean} True if STOP, RETURN, REVERT, INVALID, or SELFDESTRUCT
 *
 * @example
 * ```typescript
 * Opcode.isTerminator(Opcode.RETURN); // true
 * Opcode.isTerminator(Opcode.ADD); // false
 * ```
 */
export function isTerminator(opcode) {
	return (
		opcode === constants.STOP ||
		opcode === constants.RETURN ||
		opcode === constants.REVERT ||
		opcode === constants.INVALID ||
		opcode === constants.SELFDESTRUCT
	);
}
