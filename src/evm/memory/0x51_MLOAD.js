import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { readMemory } from "../Frame/readMemory.js";
import { memoryExpansionCost } from "../Frame/memoryExpansionCost.js";

/**
 * MLOAD opcode (0x51) - Load word from memory
 *
 * Pops offset from stack, reads 32 bytes from memory starting at offset,
 * and pushes the result as a 256-bit value onto the stack.
 *
 * Gas cost: GasFastestStep (3) + memory expansion cost
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function mload(frame) {
	// Pop offset from stack
	const offsetResult = popStack(frame);
	if (offsetResult.error) return offsetResult.error;
	const offset = offsetResult.value;

	// Check offset fits in safe integer range
	if (offset > Number.MAX_SAFE_INTEGER) {
		return { type: "OutOfBounds" };
	}
	const off = Number(offset);

	// Calculate memory expansion cost for reading 32 bytes
	const endBytes = off + 32;
	const memCost = memoryExpansionCost(frame, endBytes);

	// Charge gas: GasFastestStep (3) + memory expansion
	const gasErr = consumeGas(frame, 3n + memCost);
	if (gasErr) return gasErr;

	// Update memory size if needed
	const alignedSize = Math.ceil(endBytes / 32) * 32;
	if (alignedSize > frame.memorySize) {
		frame.memorySize = alignedSize;
	}

	// Read 32 bytes from memory and construct 256-bit value
	let result = 0n;
	for (let i = 0; i < 32; i++) {
		const byte = readMemory(frame, off + i);
		result = (result << 8n) | BigInt(byte);
	}

	// Push result onto stack
	const pushErr = pushStack(frame, result);
	if (pushErr) return pushErr;

	// Increment program counter
	frame.pc += 1;
	return null;
}
