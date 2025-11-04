// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Get position for SWAP instruction
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {number | undefined} Stack position (1-16), or undefined if not a SWAP
 *
 * @example
 * ```typescript
 * Opcode.swapPosition(Opcode.SWAP1); // 1
 * Opcode.swapPosition(Opcode.SWAP16); // 16
 * Opcode.swapPosition(Opcode.ADD); // undefined
 * ```
 */
export function swapPosition(opcode) {
	if (opcode >= constants.SWAP1 && opcode <= constants.SWAP16) {
		return opcode - constants.SWAP1 + 1;
	}
	return undefined;
}
