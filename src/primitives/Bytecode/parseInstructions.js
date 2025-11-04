import { isPush } from "./isPush.js";
import { getPushSize } from "./getPushSize.js";

/**
 * Parse bytecode into instructions
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} code - Bytecode to parse
 * @returns {import('./BrandedBytecode.js').Instruction[]} Array of instructions
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const instructions = Bytecode.parseInstructions(code);
 * // [
 * //   { opcode: 0x60, position: 0, pushData: Uint8Array([0x01]) },
 * //   { opcode: 0x60, position: 2, pushData: Uint8Array([0x02]) },
 * //   { opcode: 0x01, position: 4 }
 * // ]
 * ```
 */
export function parseInstructions(code) {
	const instructions = [];
	let pc = 0;

	while (pc < code.length) {
		const opcode = code[pc] ?? 0;

		if (isPush(opcode)) {
			const pushSize = getPushSize(opcode);
			const pushData = code.slice(pc + 1, pc + 1 + pushSize);
			instructions.push({ opcode, position: pc, pushData });
			pc += 1 + pushSize;
		} else {
			instructions.push({ opcode, position: pc });
			pc += 1;
		}
	}

	return instructions;
}
