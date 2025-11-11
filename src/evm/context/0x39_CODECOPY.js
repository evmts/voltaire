import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { memoryExpansionCost } from "../Frame/memoryExpansionCost.js";
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
 * CODECOPY opcode (0x39) - Copy code running in current environment to memory
 *
 * Stack: [destOffset, offset, length] => []
 * Gas: 3 (GasFastestStep) + memory expansion + copy cost
 *
 * Copies length bytes from bytecode[offset:offset+length] to memory[destOffset:destOffset+length].
 * If offset + i >= bytecode.length, remaining bytes are zero-padded.
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function codecopy(frame) {
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

	// Calculate memory expansion cost
	const endBytes = destOff + len;
	const memCost = memoryExpansionCost(frame, endBytes);
	const copyCost = copyGasCost(len);

	// Charge gas: GasFastestStep (3) + memory expansion + copy cost
	const gasErr = consumeGas(frame, 3n + memCost + copyCost);
	if (gasErr) return gasErr;

	// Copy code to memory
	for (let i = 0; i < len; i++) {
		const srcAddResult = addU32(srcOff, i);
		if (srcAddResult.error) return srcAddResult.error;
		const srcIdx = srcAddResult.value;
		const byte = srcIdx < frame.bytecode.length ? frame.bytecode[srcIdx] : 0;

		const destAddResult = addU32(destOff, i);
		if (destAddResult.error) return destAddResult.error;
		writeMemory(frame, destAddResult.value, byte);
	}

	frame.pc += 1;
	return null;
}
