import { analyzeBlocks } from "./analyzeBlocks.js";

// Cache blocks per bytecode instance
const blockCache = new WeakMap();

/**
 * Get basic block containing the given program counter
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} bytecode
 * @param {number} pc - Program counter position
 * @returns {import('./BrandedBytecode.js').BasicBlock | undefined}
 *
 * @example
 * ```typescript
 * const bytecode = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
 * const block = Bytecode.getBlock(bytecode, 0);
 * // { index: 0, startPc: 0, endPc: 3, ... }
 * ```
 */
export function getBlock(bytecode, pc) {
	// Bounds check
	if (pc < 0 || pc >= bytecode.length) {
		return undefined;
	}

	// Get or compute blocks
	let blocks = blockCache.get(bytecode);
	if (!blocks) {
		blocks = analyzeBlocks(bytecode);
		blockCache.set(bytecode, blocks);
	}

	if (blocks.length === 0) {
		return undefined;
	}

	// Binary search for block containing PC
	let left = 0;
	let right = blocks.length - 1;

	while (left <= right) {
		const mid = Math.floor((left + right) / 2);
		const block = blocks[mid];

		if (pc < block.startPc) {
			right = mid - 1;
		} else if (pc >= block.endPc) {
			left = mid + 1;
		} else {
			// Found: startPc <= pc < endPc
			return block;
		}
	}

	return undefined;
}
