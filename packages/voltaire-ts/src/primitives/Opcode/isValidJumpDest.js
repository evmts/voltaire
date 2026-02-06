// @ts-nocheck
import { jumpDests } from "./jumpDests.js";

/**
 * Check if offset is a valid jump destination
 *
 * @param {Uint8Array} bytecode - Raw bytecode bytes
 * @param {number} offset - Byte offset to check
 * @returns {boolean} True if offset is a JUMPDEST and not inside immediate data
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x5b, 0x60, 0x01]);
 * Opcode.isValidJumpDest(bytecode, 0); // true (JUMPDEST)
 * Opcode.isValidJumpDest(bytecode, 2); // false (immediate data)
 * ```
 */
export function isValidJumpDest(bytecode, offset) {
	const dests = jumpDests(bytecode);
	return dests.has(offset);
}
