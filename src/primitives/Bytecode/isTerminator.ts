import type { Opcode } from "./BrandedBytecode.js";
import { STOP, RETURN, REVERT, INVALID } from "./constants.js";

/**
 * Check if opcode terminates execution
 *
 * @param opcode - Opcode to check
 * @returns true if opcode terminates execution
 *
 * @example
 * ```typescript
 * isTerminator(0xf3); // true (RETURN)
 * isTerminator(0xfd); // true (REVERT)
 * isTerminator(0x00); // true (STOP)
 * ```
 */
export function isTerminator(opcode: Opcode): boolean {
	return (
		opcode === STOP ||
		opcode === RETURN ||
		opcode === REVERT ||
		opcode === INVALID
	);
}
