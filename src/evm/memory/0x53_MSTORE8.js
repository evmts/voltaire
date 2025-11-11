import { popStack } from "../Frame/popStack.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { writeMemory } from "../Frame/writeMemory.js";
import { memoryExpansionCost } from "../Frame/memoryExpansionCost.js";

/**
 * MSTORE8 opcode (0x53) - Save byte to memory
 *
 * Pops offset and value from stack, writes the least significant byte
 * of value to memory at offset.
 *
 * Gas cost: GasFastestStep (3) + memory expansion cost
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function mstore8(frame) {
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

	// Calculate memory expansion cost for writing 1 byte
	const endBytes = off + 1;
	const memCost = memoryExpansionCost(frame, endBytes);

	// Charge gas: GasFastestStep (3) + memory expansion
	const gasErr = consumeGas(frame, 3n + memCost);
	if (gasErr) return gasErr;

	// Write least significant byte to memory
	const byteValue = Number(value & 0xffn);
	writeMemory(frame, off, byteValue);

	// Increment program counter
	frame.pc += 1;
	return null;
}
