import { isPush } from "./isPush.js";

/**
 * Get PUSH instruction size (number of bytes pushed)
 *
 * @param {import('./BrandedBytecode.js').Opcode} opcode - PUSH opcode
 * @returns {number} Number of bytes (1-32), or 0 if not a PUSH
 *
 * @example
 * ```typescript
 * getPushSize(0x60); // 1 (PUSH1)
 * getPushSize(0x7f); // 32 (PUSH32)
 * ```
 */
export function getPushSize(opcode) {
	if (!isPush(opcode)) return 0;
	return opcode - 0x5f;
}
