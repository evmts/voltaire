import { popStack } from "../Frame/popStack.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { memoryExpansionCost } from "../Frame/memoryExpansionCost.js";
import { readMemory } from "../Frame/readMemory.js";

/**
 * Calculate word count from bytes
 * @param {number} bytes - Byte count
 * @returns {number} Word count
 */
function wordCount(bytes) {
	return Math.ceil(bytes / 32);
}

/**
 * Calculate word-aligned size
 * @param {number} bytes - Byte count
 * @returns {number} Word-aligned size
 */
function wordAlignedSize(bytes) {
	const words = wordCount(bytes);
	return words * 32;
}

/**
 * REVERT opcode (0xfd) - Halt execution and revert state changes
 *
 * Note: REVERT was introduced in Byzantium hardfork (EIP-140).
 * Hardfork validation should be handled by the EVM executor.
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0xfd_REVERT(frame) {
	const offsetResult = popStack(frame);
	if (offsetResult.error) return offsetResult.error;
	const offset = offsetResult.value;

	const lengthResult = popStack(frame);
	if (lengthResult.error) return lengthResult.error;
	const length = lengthResult.value;

	// Check if offset + length fits in u32
	if (offset > 0xffffffffn || length > 0xffffffffn) {
		return { type: "OutOfBounds" };
	}

	const off = Number(offset);
	const len = Number(length);

	if (length > 0n) {
		// Charge memory expansion
		const endBytes = off + len;
		const memCost = memoryExpansionCost(frame, endBytes);
		const gasErr = consumeGas(frame, memCost);
		if (gasErr) return gasErr;

		const alignedSize = wordAlignedSize(endBytes);
		if (alignedSize > frame.memorySize) {
			frame.memorySize = alignedSize;
		}

		// Copy memory to output
		frame.output = new Uint8Array(len);
		for (let idx = 0; idx < len; idx++) {
			const addr = off + idx;
			frame.output[idx] = readMemory(frame, addr);
		}
	}

	frame.reverted = true;
	return null;
}
