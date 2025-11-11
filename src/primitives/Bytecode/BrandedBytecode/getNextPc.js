import { getPushSize } from "./getPushSize.js";

/**
 * Get next program counter after executing instruction at currentPc
 *
 * @param {import('./BrandedBytecode.ts').BrandedBytecode} bytecode
 * @param {number} currentPc - Current program counter
 * @returns {number | undefined} Next PC, or undefined if at/beyond end
 *
 * @example
 * ```typescript
 * const bytecode = Bytecode.from("0x6001");  // PUSH1 0x01
 * getNextPc(bytecode, 0);  // 2 (PUSH1 = 1 byte opcode + 1 byte data)
 *
 * const bytecode2 = Bytecode.from("0x01");   // ADD
 * getNextPc(bytecode2, 0); // undefined (would be at EOF)
 * ```
 */
export function getNextPc(bytecode, currentPc) {
	// Validate current PC is within bounds
	if (currentPc < 0 || currentPc >= bytecode.length) {
		return undefined;
	}

	// Get opcode at current position
	const opcode = bytecode[currentPc];

	// Calculate next PC based on opcode type
	const pushSize = getPushSize(opcode);
	const nextPc = currentPc + 1 + pushSize;

	// Check if next PC is within bounds
	if (nextPc >= bytecode.length) {
		return undefined;
	}

	return nextPc;
}
