import { JUMPDEST } from "./constants.js";
import { isPush } from "./isPush.js";
import { getPushSize } from "./getPushSize.js";

/**
 * Analyze bytecode to identify valid JUMPDEST locations
 *
 * This must skip over PUSH instruction immediate data to avoid
 * treating data bytes as instructions.
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} code - Bytecode to analyze
 * @returns {Set<number>} Set of valid JUMPDEST positions
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x5b, 0x5b]); // PUSH1 0x5b, JUMPDEST
 * const jumpdests = Bytecode.analyzeJumpDestinations(code);
 * jumpdests.has(1); // false (inside PUSH data)
 * jumpdests.has(2); // true (actual JUMPDEST)
 * ```
 */
export function analyzeJumpDestinations(code) {
	const validJumpdests = new Set();
	let pc = 0;

	while (pc < code.length) {
		const opcode = code[pc] ?? 0;

		if (opcode === JUMPDEST) {
			validJumpdests.add(pc);
			pc += 1;
		} else if (isPush(opcode)) {
			const pushSize = getPushSize(opcode);
			pc += 1 + pushSize;
		} else {
			pc += 1;
		}
	}

	return validJumpdests;
}
