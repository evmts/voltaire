// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Check if opcode is JUMPDEST
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to check
 * @returns {boolean} True if JUMPDEST
 *
 * @example
 * ```typescript
 * Opcode.isJumpDestination(Opcode.JUMPDEST); // true
 * Opcode.isJumpDestination(Opcode.JUMP); // false
 * ```
 */
export function isJumpDestination(opcode) {
	return opcode === constants.JUMPDEST;
}
