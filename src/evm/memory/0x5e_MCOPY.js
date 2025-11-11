import { popStack } from "../Frame/popStack.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { readMemory } from "../Frame/readMemory.js";
import { writeMemory } from "../Frame/writeMemory.js";
import { memoryExpansionCost } from "../Frame/memoryExpansionCost.js";

/**
 * Calculate word-aligned memory size
 * @param {number} bytes - Byte count
 * @returns {number} Word-aligned size
 */
function wordAlignedSize(bytes) {
	return Math.ceil(bytes / 32) * 32;
}

/**
 * Calculate copy gas cost (3 gas per word)
 * @param {number} sizeBytes - Size in bytes
 * @returns {bigint} Gas cost
 */
function copyGasCost(sizeBytes) {
	const words = Math.ceil(sizeBytes / 32);
	return BigInt(words * 3);
}

/**
 * MCOPY opcode (0x5e) - Copy memory (EIP-5656, Cancun+)
 *
 * Pops dest, src, len from stack. Copies len bytes from src to dest.
 * Handles overlapping regions correctly using temporary buffer.
 *
 * Gas cost: GasFastestStep (3) + memory expansion cost + copy cost (3 gas per word)
 *
 * Note: This opcode was introduced in the Cancun hardfork (EIP-5656).
 * Implementation assumes hardfork check is done externally.
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function mcopy(frame) {
	// Pop dest, src, len from stack
	const destResult = popStack(frame);
	if (destResult.error) return destResult.error;
	const dest = destResult.value;

	const srcResult = popStack(frame);
	if (srcResult.error) return srcResult.error;
	const src = srcResult.value;

	const lenResult = popStack(frame);
	if (lenResult.error) return lenResult.error;
	const len = lenResult.value;

	// Calculate memory expansion cost
	// Per EIP-5656: if len == 0, no memory expansion occurs
	let memCost = 0n;
	if (len !== 0n) {
		// Use safe conversion - if values don't fit, treat as huge memory access
		const destU64 =
			dest <= Number.MAX_SAFE_INTEGER ? Number(dest) : Number.MAX_SAFE_INTEGER;
		const srcU64 =
			src <= Number.MAX_SAFE_INTEGER ? Number(src) : Number.MAX_SAFE_INTEGER;
		const lenU64 =
			len <= Number.MAX_SAFE_INTEGER ? Number(len) : Number.MAX_SAFE_INTEGER;

		// Calculate end positions (use saturating addition to prevent overflow)
		const endDest = destU64 + lenU64;
		const endSrc = srcU64 + lenU64;

		// Memory expansion must cover BOTH ranges
		const maxEnd = Math.max(endDest, endSrc);
		memCost = memoryExpansionCost(frame, maxEnd);
	}

	// Calculate copy cost
	let copyCost = 0n;
	if (len <= Number.MAX_SAFE_INTEGER) {
		copyCost = copyGasCost(Number(len));
	} else {
		// Astronomical copy cost will trigger OutOfGas
		copyCost = BigInt(Number.MAX_SAFE_INTEGER);
	}

	// Charge total gas: GasFastestStep (3) + memory expansion + copy cost
	const totalGas = 3n + memCost + copyCost;
	const gasErr = consumeGas(frame, totalGas);
	if (gasErr) return gasErr;

	// Fast path: zero length - gas charged but no copy needed
	if (len === 0n) {
		frame.pc += 1;
		return null;
	}

	// Bounds checking for actual memory operations
	if (
		dest > Number.MAX_SAFE_INTEGER ||
		src > Number.MAX_SAFE_INTEGER ||
		len > Number.MAX_SAFE_INTEGER
	) {
		return { type: "OutOfBounds" };
	}

	const destU32 = Number(dest);
	const srcU32 = Number(src);
	const lenU32 = Number(len);

	// Expand memory to cover BOTH source and destination ranges
	const srcEnd = srcU32 + lenU32;
	const destEnd = destU32 + lenU32;
	const maxMemoryEnd = Math.max(srcEnd, destEnd);
	const requiredSize = wordAlignedSize(maxMemoryEnd);

	if (requiredSize > frame.memorySize) {
		frame.memorySize = requiredSize;
	}

	// Copy via temporary buffer to handle overlapping regions
	const tmp = new Uint8Array(lenU32);
	for (let i = 0; i < lenU32; i++) {
		tmp[i] = readMemory(frame, srcU32 + i);
	}
	for (let i = 0; i < lenU32; i++) {
		writeMemory(frame, destU32 + i, tmp[i]);
	}

	// Increment program counter
	frame.pc += 1;
	return null;
}
