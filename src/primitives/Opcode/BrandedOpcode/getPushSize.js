// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Get PUSH data size in bytes
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {number} Push size (0 for PUSH0, 1-32 for PUSH1-PUSH32, 0 for non-PUSH)
 *
 * @example
 * ```typescript
 * Opcode.getPushSize(Opcode.PUSH0); // 0
 * Opcode.getPushSize(Opcode.PUSH1); // 1
 * Opcode.getPushSize(Opcode.PUSH32); // 32
 * Opcode.getPushSize(Opcode.ADD); // 0
 * ```
 */
export function getPushSize(opcode) {
	if (opcode === constants.PUSH0) return 0;
	if (opcode >= constants.PUSH1 && opcode <= constants.PUSH32) {
		return opcode - constants.PUSH1 + 1;
	}
	return 0;
}
