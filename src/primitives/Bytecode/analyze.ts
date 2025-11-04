import type { BrandedBytecode, Analysis } from "./BrandedBytecode.js";
import { analyzeJumpDestinations } from "./analyzeJumpDestinations.js";
import { parseInstructions } from "./parseInstructions.js";
import { validate } from "./validate.js";

/**
 * Perform complete bytecode analysis
 *
 * @param code - Bytecode to analyze
 * @returns Complete analysis result
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x5b, 0x00]);
 * const analysis = Bytecode.analyze(code);
 * // {
 * //   valid: true,
 * //   jumpDestinations: Set([2]),
 * //   instructions: [...],
 * // }
 * ```
 */
export function analyze(code: BrandedBytecode): Analysis {
	return {
		valid: validate(code),
		jumpDestinations: analyzeJumpDestinations(code),
		instructions: parseInstructions(code),
	};
}
