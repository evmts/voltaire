// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Get number of topics for LOG instruction
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {number | undefined} Number of topics (0-4), or undefined if not a LOG
 *
 * @example
 * ```typescript
 * Opcode.logTopics(Opcode.LOG0); // 0
 * Opcode.logTopics(Opcode.LOG4); // 4
 * Opcode.logTopics(Opcode.ADD); // undefined
 * ```
 */
export function logTopics(opcode) {
	if (opcode >= constants.LOG0 && opcode <= constants.LOG4) {
		return opcode - constants.LOG0;
	}
	return undefined;
}
