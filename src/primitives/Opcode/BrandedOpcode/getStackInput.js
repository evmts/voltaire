// @ts-nocheck
import { INFO_TABLE } from "./infoTable.js";

/**
 * Get number of stack items consumed by an opcode
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {number | undefined} Number of stack items consumed
 *
 * @example
 * ```typescript
 * const inputs = Opcode.getStackInput(Opcode.ADD); // 2
 * const inputs2 = Opcode.getStackInput(Opcode.PUSH1); // 0
 * ```
 */
export function getStackInput(opcode) {
	return INFO_TABLE.get(opcode)?.stackInputs;
}
