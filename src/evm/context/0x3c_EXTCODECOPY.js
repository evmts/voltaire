import { fromNumber } from "../../primitives/Address/fromNumber.js";
import { Copy } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { memoryExpansionCost } from "../Frame/memoryExpansionCost.js";
import { popStack } from "../Frame/popStack.js";
import { writeMemory } from "../Frame/writeMemory.js";
import { gasCostAccessAddress } from "./gasCostAccessAddress.js";

/**
 * Add two u32 values with overflow checking
 * @param {number} a - First value
 * @param {number} b - Second value
 * @returns {{value: number, error: null} | {value: null, error: import("../Frame/FrameType.js").EvmError}}
 */
function addU32(a, b) {
	const result = a + b;
	if (result > 0xffffffff) {
		return { value: null, error: { type: "OutOfBounds" } };
	}
	return { value: result, error: null };
}

/**
 * Calculate copy gas cost based on size (3 gas per word)
 * @param {number} size - Size in bytes
 * @returns {bigint} Gas cost
 */
function copyGasCost(size) {
	const words = Math.ceil(size / 32);
	return BigInt(words) * Copy;
}

/**
 * EXTCODECOPY opcode (0x3c) - Copy an account's code to memory
 *
 * Stack: [address, destOffset, offset, size] => []
 *
 * Gas costs include three components:
 * 1. Access cost: hardfork-dependent (EIP-150, EIP-1884, EIP-2929)
 * 2. Copy cost: 3 gas per 32-byte word (rounded up)
 * 3. Memory expansion cost: Quadratic expansion cost for new memory
 *
 * Gas varies by hardfork:
 * - Pre-Tangerine Whistle: 20 gas access
 * - Tangerine Whistle (EIP-150): 700 gas access
 * - Istanbul (EIP-1884): 700 gas access
 * - Berlin (EIP-2929): 2600 gas (cold) / 100 gas (warm) access
 *
 * EIP-2929 (Berlin) tracks warm/cold access for state operations.
 * Copies size bytes from code[offset:offset+size] to memory[destOffset:].
 * Missing bytes (beyond code length) are zero-padded.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/HostType.js").BrandedHost} host - Host interface
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function extcodecopy(frame, host) {
	const addrResult = popStack(frame);
	if (addrResult.error) return addrResult.error;
	const addrU256 = addrResult.value;

	const destOffsetResult = popStack(frame);
	if (destOffsetResult.error) return destOffsetResult.error;
	const destOffset = destOffsetResult.value;

	const offsetResult = popStack(frame);
	if (offsetResult.error) return offsetResult.error;
	const offset = offsetResult.value;

	const sizeResult = popStack(frame);
	if (sizeResult.error) return sizeResult.error;
	const size = sizeResult.value;

	if (destOffset > 0xffffffff || offset > 0xffffffff || size > 0xffffffff) {
		return { type: "OutOfBounds" };
	}

	const addr = fromNumber(addrU256);
	const dest = Number(destOffset);
	const off = Number(offset);
	const len = Number(size);

	// Calculate hardfork-aware access cost with warm/cold tracking
	const accessCost = gasCostAccessAddress(frame, addr);
	// Copy cost: 3 gas per 32-byte word
	const copyCost = copyGasCost(len);
	// Memory expansion cost
	const endBytes = dest + len;
	const memCost = memoryExpansionCost(frame, endBytes);

	// Charge all costs at once: access + copy + memory expansion
	const gasErr = consumeGas(frame, accessCost + copyCost + memCost);
	if (gasErr) return gasErr;

	// Get the code from the external address
	const code = host.getCode(addr);

	// Copy code to memory, zero-padding if needed
	for (let i = 0; i < len; i++) {
		const destAddResult = addU32(dest, i);
		if (destAddResult.error) return destAddResult.error;
		const dstIdx = destAddResult.value;

		const srcIdx = off + i;
		const byte = srcIdx < code.length ? /** @type {number} */ (code[srcIdx]) : 0;
		writeMemory(frame, dstIdx, byte);
	}

	frame.pc += 1;
	return null;
}
