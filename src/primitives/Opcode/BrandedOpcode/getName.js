// @ts-nocheck
import { INFO_TABLE } from "./infoTable.js";

/**
 * Get mnemonic name of an opcode (alias for name)
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {string} Opcode name or "UNKNOWN" if invalid
 *
 * @example
 * ```typescript
 * const name = Opcode.getName(Opcode.ADD); // "ADD"
 * const name2 = Opcode.getName(0xFF); // "SELFDESTRUCT"
 * ```
 */
export function getName(opcode) {
	return INFO_TABLE.get(opcode)?.name ?? "UNKNOWN";
}
