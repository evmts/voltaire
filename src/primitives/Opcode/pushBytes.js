// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Get number of bytes pushed by PUSH instruction
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {number | undefined} Number of bytes (0-32), or undefined if not a PUSH
 *
 * @example
 * ```typescript
 * Opcode.pushBytes(Opcode.PUSH1); // 1
 * Opcode.pushBytes(Opcode.PUSH32); // 32
 * Opcode.pushBytes(Opcode.PUSH0); // 0
 * Opcode.pushBytes(Opcode.ADD); // undefined
 * ```
 */
export function pushBytes(opcode) {
	if (opcode === constants.PUSH0) return 0;
	if (opcode >= constants.PUSH1 && opcode <= constants.PUSH32) {
		return opcode - constants.PUSH1 + 1;
	}
	return undefined;
}
