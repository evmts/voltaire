import { popStack } from "../Frame/popStack.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { memoryExpansionCost } from "../Frame/memoryExpansionCost.js";
import { readMemory } from "../Frame/readMemory.js";
import {
	LogBase,
	LogData,
	LogTopic,
} from "../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * LOG4 (0xa4) - Log with 4 topics
 *
 * Stack:
 *   in: offset, length, topic0, topic1, topic2, topic3
 *   out: -
 *
 * Gas: 375 (base) + 1500 (4 topics) + 8 * dataLength + memory expansion
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function handler_0xa4_LOG4(frame) {
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

	// Pop 4 topics
	const topic0Result = popStack(frame);
	if (topic0Result.error) return topic0Result.error;
	const topic0 = topic0Result.value;

	const topic1Result = popStack(frame);
	if (topic1Result.error) return topic1Result.error;
	const topic1 = topic1Result.value;

	const topic2Result = popStack(frame);
	if (topic2Result.error) return topic2Result.error;
	const topic2 = topic2Result.value;

	const topic3Result = popStack(frame);
	if (topic3Result.error) return topic3Result.error;
	const topic3 = topic3Result.value;

	// Check values fit in safe integer range
	if (offset > Number.MAXSAFEINTEGER || length > Number.MAXSAFEINTEGER) {
		return { type: "OutOfBounds" };
	}
	const off = Number(offset);
	const len = Number(length);

	// Calculate gas cost: 375 + 4*375 + 8*dataLength + memory expansion
	const logCost = LogBase + 4n * LogTopic + LogData * BigInt(len);
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

	// Create log entry with 4 topics
	const log = {
		address: frame.address,
		topics: [topic0, topic1, topic2, topic3],
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
