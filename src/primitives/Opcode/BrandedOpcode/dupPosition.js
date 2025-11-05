// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Get position for DUP instruction
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {number | undefined} Stack position (1-16), or undefined if not a DUP
 *
 * @example
 * ```typescript
 * Opcode.dupPosition(Opcode.DUP1); // 1
 * Opcode.dupPosition(Opcode.DUP16); // 16
 * Opcode.dupPosition(Opcode.ADD); // undefined
 * ```
 */
export function dupPosition(opcode) {
	if (opcode >= constants.DUP1 && opcode <= constants.DUP16) {
		return opcode - constants.DUP1 + 1;
	}
	return undefined;
}
