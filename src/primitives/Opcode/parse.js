// @ts-nocheck
import { pushBytes } from "./pushBytes.js";

/**
 * Parse bytecode into instructions
 *
 * @param {Uint8Array} bytecode - Raw bytecode bytes
 * @returns {import('./BrandedOpcode.js').Instruction[]} Array of parsed instructions
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const instructions = Opcode.parse(bytecode);
 * // [
 * //   { offset: 0, opcode: PUSH1, immediate: [0x01] },
 * //   { offset: 2, opcode: PUSH1, immediate: [0x02] },
 * //   { offset: 4, opcode: ADD }
 * // ]
 * ```
 */
export function parse(bytecode) {
	/** @type {import('./BrandedOpcode.js').Instruction[]} */
	const instructions = [];
	let offset = 0;

	while (offset < bytecode.length) {
		const opcode = /** @type {import('./BrandedOpcode.js').BrandedOpcode} */ (bytecode[offset]);
		const pushBytesCount = pushBytes(opcode);

		if (pushBytesCount !== undefined && pushBytesCount > 0) {
			const immediateEnd = Math.min(offset + 1 + pushBytesCount, bytecode.length);
			const immediate = bytecode.slice(offset + 1, immediateEnd);
			instructions.push({ offset, opcode, immediate });
			offset = immediateEnd;
		} else {
			instructions.push({ offset, opcode });
			offset++;
		}
	}

	return instructions;
}
