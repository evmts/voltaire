import { getPushSize } from "./getPushSize.js";
import { isPush } from "./isPush.js";

/**
 * Validate bytecode structure
 *
 * Performs basic validation checks on bytecode:
 * - Checks for incomplete PUSH instructions
 * - Validates bytecode can be parsed without errors
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} code - Bytecode to validate
 * @returns {boolean} true if bytecode is valid
 *
 * @example
 * ```typescript
 * const valid = new Uint8Array([0x60, 0x01]); // PUSH1 0x01
 * Bytecode.validate(valid); // true
 *
 * const invalid = new Uint8Array([0x60]); // PUSH1 with no data
 * Bytecode.validate(invalid); // false
 * ```
 */
export function validate(code) {
	let pc = 0;

	while (pc < code.length) {
		const opcode = code[pc] ?? 0;

		if (isPush(opcode)) {
			const pushSize = getPushSize(opcode);

			// Check if we have enough bytes for the PUSH data
			if (pc + pushSize >= code.length) {
				// Incomplete PUSH instruction
				return false;
			}

			pc += 1 + pushSize;
		} else {
			pc += 1;
		}
	}

	return true;
}
