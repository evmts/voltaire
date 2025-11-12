import { consumeGas } from "../Frame/consumeGas.js";
import { memoryExpansionCost } from "../Frame/memoryExpansionCost.js";
import { popStack } from "../Frame/popStack.js";
import { writeMemory } from "../Frame/writeMemory.js";

/**
 * Add two u32 values with overflow checking
 * @param {number} a - First value
 * @param {number} b - Second value
 * @returns {{value: number, error: null} | {value: null, error: import("../Frame/BrandedFrame.js").EvmError}}
 */
function addU32(a, b) {
	const result = a + b;
	if (result > 0xffffffff) {
		return { value: null, error: { type: "OutOfBounds" } };
	}
	return { value: result, error: null };
}

/**
 * Calculate copy gas cost based on size
 * @param {number} size - Size in bytes
 * @returns {bigint} Gas cost
 */
function copyGasCost(size) {
	const words = Math.ceil(size / 32);
	return BigInt(words * 3);
}

/**
 * Calculate word-aligned memory size
 * @param {number} bytes - Byte count
 * @returns {number} Word-aligned size
 */
function wordAlignedSize(bytes) {
	const words = Math.ceil(bytes / 32);
	return words * 32;
}

/**
 * RETURNDATACOPY opcode (0x3e) - Copy output data from the previous call to memory
 *
 * Stack: [destOffset, offset, length] => []
 * Gas: 3 (GasFastestStep) + memory expansion + copy cost
 *
 * EIP-211: Introduced in Byzantium hardfork
 * Copies length bytes from returnData[offset:offset+length] to memory[destOffset:destOffset+length].
 * Throws OutOfBounds if offset + length > returnData.length.
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function returndatacopy(frame) {
	// TODO: Add hardfork check for Byzantium+

	const destOffsetResult = popStack(frame);
	if (destOffsetResult.error) return destOffsetResult.error;
	const destOffset = destOffsetResult.value;

	const offsetResult = popStack(frame);
	if (offsetResult.error) return offsetResult.error;
	const offset = offsetResult.value;

	const lengthResult = popStack(frame);
	if (lengthResult.error) return lengthResult.error;
	const length = lengthResult.value;

	if (destOffset > 0xffffffff || offset > 0xffffffff || length > 0xffffffff) {
		return { type: "OutOfBounds" };
	}

	const destOff = Number(destOffset);
	const srcOff = Number(offset);
	const len = Number(length);

	// Check bounds with overflow-safety
	const rdLen = frame.returnData.length;
	if (srcOff > rdLen || len > rdLen - srcOff) {
		return { type: "OutOfBounds" };
	}

	// Calculate memory expansion cost
	const endBytes = destOff + len;
	const memCost = memoryExpansionCost(frame, endBytes);
	const copyCost = copyGasCost(len);

	// Charge gas: GasFastestStep (3) + memory expansion + copy cost
	const gasErr = consumeGas(frame, 3n + memCost + copyCost);
	if (gasErr) return gasErr;

	// Update memory size after charging for expansion
	const alignedSize = wordAlignedSize(endBytes);
	if (alignedSize > frame.memorySize) {
		frame.memorySize = alignedSize;
	}

	// Copy return data to memory
	for (let i = 0; i < len; i++) {
		const srcIdx = srcOff + i;
		const byte = frame.returnData[srcIdx];

		const destAddResult = addU32(destOff, i);
		if (destAddResult.error) return destAddResult.error;
		writeMemory(frame, destAddResult.value, byte);
	}

	frame.pc += 1;
	return null;
}
