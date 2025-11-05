// @ts-nocheck
import { name } from "./name.js";

/**
 * Format instruction to human-readable string
 *
 * @param {import('./BrandedOpcode.js').Instruction} instruction - Instruction to format
 * @returns {string} Human-readable string
 *
 * @example
 * ```typescript
 * const inst = {
 *   offset: 0,
 *   opcode: Opcode.PUSH1,
 *   immediate: new Uint8Array([0x42])
 * };
 * Opcode.format(inst); // "0x0000: PUSH1 0x42"
 * ```
 */
export function format(instruction) {
	const offsetHex = instruction.offset.toString(16).padStart(4, "0");
	const nameStr = name(instruction.opcode);

	if (instruction.immediate && instruction.immediate.length > 0) {
		const hex = Array.from(instruction.immediate)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return `0x${offsetHex}: ${nameStr} 0x${hex}`;
	}

	return `0x${offsetHex}: ${nameStr}`;
}
