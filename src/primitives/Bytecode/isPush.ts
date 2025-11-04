import type { Opcode } from "./BrandedBytecode.js";
import { PUSH1, PUSH32 } from "./constants.js";

/**
 * Check if opcode is a PUSH instruction (PUSH1-PUSH32)
 *
 * @param opcode - Opcode to check
 * @returns true if opcode is PUSH1-PUSH32
 *
 * @example
 * ```typescript
 * isPush(0x60); // true (PUSH1)
 * isPush(0x7f); // true (PUSH32)
 * isPush(0x00); // false
 * ```
 */
export function isPush(opcode: Opcode): boolean {
	return opcode >= PUSH1 && opcode <= PUSH32;
}
