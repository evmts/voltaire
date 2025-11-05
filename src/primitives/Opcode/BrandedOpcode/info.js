// @ts-nocheck
import { INFO_TABLE } from "./infoTable.js";

/**
 * Get metadata for an opcode
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {import('./BrandedOpcode.js').Info | undefined} Metadata with gas cost and stack requirements
 *
 * @example
 * ```typescript
 * const info = Opcode.info(Opcode.ADD);
 * console.log(info?.name); // "ADD"
 * console.log(info?.gasCost); // 3
 * ```
 */
export function info(opcode) {
	return INFO_TABLE.get(opcode);
}
