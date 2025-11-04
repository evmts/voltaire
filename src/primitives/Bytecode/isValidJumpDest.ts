import type { BrandedBytecode } from "./BrandedBytecode.js";
import { analyzeJumpDestinations } from "./analyzeJumpDestinations.js";

/**
 * Check if a position is a valid JUMPDEST
 *
 * @param code - Bytecode to check
 * @param position - Position to check
 * @returns true if position is a valid JUMPDEST
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x5b, 0x60, 0x5b, 0x5b]);
 * Bytecode.isValidJumpDest(code, 0); // true
 * Bytecode.isValidJumpDest(code, 2); // false (inside PUSH data)
 * Bytecode.isValidJumpDest(code, 3); // true
 * ```
 */
export function isValidJumpDest(
	code: BrandedBytecode,
	position: number,
): boolean {
	const validJumpdests = analyzeJumpDestinations(code);
	return validJumpdests.has(position);
}
