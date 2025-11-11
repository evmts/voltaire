import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { readMemory } from "../Frame/readMemory.js";
import { memoryExpansionCost } from "../Frame/memoryExpansionCost.js";
import { hash } from "../../crypto/keccak256/hash.js";
import { Keccak256Base, Keccak256Word } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * SHA3 opcode (0x20) - Compute Keccak-256 hash
 *
 * Pops offset and length from stack, reads data from memory,
 * computes Keccak-256 hash, and pushes the 32-byte result.
 *
 * Gas cost: 30 (base) + 6 * word_count + memory expansion
 * where word_count = ceil(length / 32)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function sha3(frame) {
	// Pop offset from stack
	const offsetResult = popStack(frame);
	if (offsetResult.error) return offsetResult.error;
	const offset = offsetResult.value;

	// Pop length from stack
	const lengthResult = popStack(frame);
	if (lengthResult.error) return lengthResult.error;
	const length = lengthResult.value;

	// Check offset and length fit in safe integer range
	if (offset > Number.MAX_SAFE_INTEGER) {
		return { type: "OutOfBounds" };
	}
	if (length > Number.MAX_SAFE_INTEGER) {
		return { type: "OutOfBounds" };
	}

	const off = Number(offset);
	const len = Number(length);

	// Calculate dynamic gas cost: base + word_count * per_word
	// word_count = ceil(length / 32)
	const wordCount = len === 0 ? 0n : BigInt(Math.ceil(len / 32));
	const dynamicGas = Keccak256Base + Keccak256Word * wordCount;

	// Charge dynamic gas
	const gasErr = consumeGas(frame, dynamicGas);
	if (gasErr) return gasErr;

	// Calculate memory expansion cost for reading [offset, offset+length)
	if (len > 0) {
		const endBytes = off + len;
		const memCost = memoryExpansionCost(frame, endBytes);

		// Charge memory expansion cost
		const memGasErr = consumeGas(frame, memCost);
		if (memGasErr) return memGasErr;

		// Update memory size if needed
		const alignedSize = Math.ceil(endBytes / 32) * 32;
		if (alignedSize > frame.memorySize) {
			frame.memorySize = alignedSize;
		}
	}

	// Handle empty data case
	if (len === 0) {
		// Keccak-256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
		const emptyHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470n;
		const pushErr = pushStack(frame, emptyHash);
		if (pushErr) return pushErr;

		frame.pc += 1;
		return null;
	}

	// Read data from memory
	const data = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		data[i] = readMemory(frame, off + i);
	}

	// Compute Keccak-256 hash
	const hashBytes = hash(data);

	// Convert hash bytes to bigint (big-endian)
	let hashValue = 0n;
	for (let i = 0; i < 32; i++) {
		hashValue = (hashValue << 8n) | BigInt(hashBytes[i]);
	}

	// Push hash result onto stack
	const pushErr = pushStack(frame, hashValue);
	if (pushErr) return pushErr;

	// Increment program counter
	frame.pc += 1;
	return null;
}
