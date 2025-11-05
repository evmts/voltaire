import * as constants from "./constants.js";
// @ts-nocheck
import { parse } from "./parse.js";

/**
 * Find all valid JUMPDEST locations
 *
 * @param {Uint8Array} bytecode - Raw bytecode bytes
 * @returns {Set<number>} Set of valid jump destinations (byte offsets)
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x5b, 0x60, 0x01, 0x5b]);
 * const dests = Opcode.jumpDests(bytecode); // Set { 0, 3 }
 * ```
 */
export function jumpDests(bytecode) {
	/** @type {Set<number>} */
	const dests = new Set();
	const instructions = parse(bytecode);

	for (const inst of instructions) {
		if (inst.opcode === constants.JUMPDEST) {
			dests.add(inst.offset);
		}
	}

	return dests;
}
