// @ts-nocheck
import { INFO_TABLE } from "./infoTable.js";
/**
 * Get name of an opcode
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {string} Opcode name or "UNKNOWN" if invalid
 *
 * @example
 * ```typescript
 * const name = Opcode.name(Opcode.ADD); // "ADD"
 * ```
 */
export function name(opcode) {
    return INFO_TABLE.get(opcode)?.name ?? "UNKNOWN";
}
