// @ts-nocheck
import { INFO_TABLE } from "./infoTable.js";

/**
 * Get number of stack items produced by an opcode
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {number | undefined} Number of stack items produced
 *
 * @example
 * ```typescript
 * const outputs = Opcode.getStackOutput(Opcode.ADD); // 1
 * const outputs2 = Opcode.getStackOutput(Opcode.PUSH1); // 1
 * ```
 */
export function getStackOutput(opcode) {
	return INFO_TABLE.get(opcode)?.stackOutputs;
}
