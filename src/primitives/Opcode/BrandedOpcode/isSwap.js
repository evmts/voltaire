// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Check if opcode is a SWAP instruction
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to check
 * @returns {boolean} True if SWAP1-SWAP16
 *
 * @example
 * ```typescript
 * Opcode.isSwap(Opcode.SWAP1); // true
 * Opcode.isSwap(Opcode.ADD); // false
 * ```
 */
export function isSwap(opcode) {
	return opcode >= constants.SWAP1 && opcode <= constants.SWAP16;
}
