// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Check if opcode is a jump
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to check
 * @returns {boolean} True if JUMP or JUMPI
 *
 * @example
 * ```typescript
 * Opcode.isJump(Opcode.JUMP); // true
 * Opcode.isJump(Opcode.JUMPI); // true
 * Opcode.isJump(Opcode.ADD); // false
 * ```
 */
export function isJump(opcode) {
	return opcode === constants.JUMP || opcode === constants.JUMPI;
}
