import { format } from "./format.js";
// @ts-nocheck
import { parse } from "./parse.js";

/**
 * Disassemble bytecode to human-readable strings
 *
 * @param {Uint8Array} bytecode - Raw bytecode bytes
 * @returns {string[]} Array of formatted instruction strings
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const asm = Opcode.disassemble(bytecode);
 * // [
 * //   "0x0000: PUSH1 0x01",
 * //   "0x0002: PUSH1 0x02",
 * //   "0x0004: ADD"
 * // ]
 * ```
 */
export function disassemble(bytecode) {
	const instructions = parse(bytecode);
	return instructions.map((inst) => format(inst));
}
