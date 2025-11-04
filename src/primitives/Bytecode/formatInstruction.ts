import type { Instruction } from "./BrandedBytecode.js";

/**
 * Format instruction to human-readable string
 *
 * @param instruction - Instruction to format
 * @returns Human-readable string
 *
 * @example
 * ```typescript
 * const inst = { opcode: 0x60, position: 0, pushData: new Uint8Array([0x01]) };
 * Bytecode.formatInstruction(inst); // "0x0000: PUSH1 0x01"
 * ```
 */
export function formatInstruction(instruction: Instruction): string {
	const pos = instruction.position.toString(16).padStart(4, "0");
	const opcode = instruction.opcode.toString(16).padStart(2, "0").toUpperCase();

	if (instruction.pushData) {
		const data = Array.from(instruction.pushData)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return `0x${pos}: PUSH${instruction.pushData.length} 0x${data}`;
	}

	return `0x${pos}: 0x${opcode}`;
}
