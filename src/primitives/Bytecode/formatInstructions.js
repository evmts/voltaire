import { formatInstruction } from "./formatInstruction.js";
import { parseInstructions } from "./parseInstructions.js";

/**
 * Format all instructions to human-readable strings
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} code - Bytecode to format
 * @returns {string[]} Array of formatted instructions
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x5b]);
 * const formatted = Bytecode.formatInstructions(code);
 * // ["0x0000: PUSH1 0x01", "0x0002: JUMPDEST"]
 * ```
 */
export function formatInstructions(code) {
	const instructions = parseInstructions(code);
	return instructions.map(formatInstruction);
}
