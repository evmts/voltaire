import { popStack } from "../Frame/popStack.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { writeMemory } from "../Frame/writeMemory.js";
import { memoryExpansionCost } from "../Frame/memoryExpansionCost.js";

/**
 * MSTORE opcode (0x52) - Save word to memory
 *
 * Pops offset and value from stack, writes 32 bytes to memory starting at offset.
 * Value is stored in big-endian format.
 *
 * Gas cost: GasFastestStep (3) + memory expansion cost
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function mstore(frame) {
	// Pop offset and value from stack
	const offsetResult = popStack(frame);
	if (offsetResult.error) return offsetResult.error;
	const offset = offsetResult.value;

	const valueResult = popStack(frame);
	if (valueResult.error) return valueResult.error;
	const value = valueResult.value;

	// Check offset fits in safe integer range
	if (offset > Number.MAX_SAFE_INTEGER) {
		return { type: "OutOfBounds" };
	}
	const off = Number(offset);

	// Calculate memory expansion cost for writing 32 bytes
	const endBytes = off + 32;
	const memCost = memoryExpansionCost(frame, endBytes);

	// Charge gas: GasFastestStep (3) + memory expansion
	const gasErr = consumeGas(frame, 3n + memCost);
	if (gasErr) return gasErr;

	// Write 32 bytes to memory in big-endian format
	for (let i = 0; i < 32; i++) {
		const shift = (31 - i) * 8;
		const byte = Number((value >> BigInt(shift)) & 0xffn);
		writeMemory(frame, off + i, byte);
	}

	// Increment program counter
	frame.pc += 1;
	return null;
}
