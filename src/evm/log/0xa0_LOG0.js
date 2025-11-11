import { popStack } from "../Frame/popStack.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { memoryExpansionCost } from "../Frame/memoryExpansionCost.js";
import { readMemory } from "../Frame/readMemory.js";
import {
	LogBase,
	LogData,
} from "../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * LOG0 (0xa0) - Log with 0 topics
 *
 * Stack:
 *   in: offset, length
 *   out: -
 *
 * Gas: 375 (base) + 8 * dataLength + memory expansion
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function handler_0xa0_LOG0(frame) {
	// EIP-214: LOG opcodes cannot be executed in static call context
	if (frame.isStatic) {
		return { type: "WriteProtection" };
	}

	// Pop offset and length from stack
	const offsetResult = popStack(frame);
	if (offsetResult.error) return offsetResult.error;
	const offset = offsetResult.value;

	const lengthResult = popStack(frame);
	if (lengthResult.error) return lengthResult.error;
	const length = lengthResult.value;

	// Check values fit in safe integer range
	if (offset > Number.MAX_SAFE_INTEGER || length > Number.MAX_SAFE_INTEGER) {
		return { type: "OutOfBounds" };
	}
	const off = Number(offset);
	const len = Number(length);

	// Calculate gas cost: 375 + 8*dataLength + memory expansion
	const logCost = LogBase + LogData * BigInt(len);
	const gasError = consumeGas(frame, logCost);
	if (gasError) return gasError;

	// Memory expansion if data length > 0
	if (len > 0) {
		const endBytes = off + len;
		const memCost = memoryExpansionCost(frame, endBytes);
		const memError = consumeGas(frame, memCost);
		if (memError) return memError;

		// Update memory size if needed
		const alignedSize = Math.ceil(endBytes / 32) * 32;
		if (alignedSize > frame.memorySize) {
			frame.memorySize = alignedSize;
		}
	}

	// Read data from memory
	const data = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		data[i] = readMemory(frame, off + i);
	}

	// Create log entry with 0 topics
	const log = {
		address: frame.address,
		topics: [],
		data,
	};

	// Initialize logs array if needed
	if (!frame.logs) {
		frame.logs = [];
	}

	// Store log
	frame.logs.push(log);

	frame.pc += 1;
	return null;
}
