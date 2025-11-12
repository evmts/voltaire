import { fromNumber } from "../../primitives/Address/BrandedAddress/fromNumber.js";
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
 * EXTCODECOPY opcode (0x3c) - Copy an account's code to memory
 *
 * Stack: [address, destOffset, offset, size] => []
 * Gas: Variable (hardfork-dependent: 20/700/2600/100) + memory expansion + copy cost
 *
 * Copies size bytes from external account's code[offset:offset+size] to memory[destOffset:destOffset+size].
 * If offset + i >= code.length, remaining bytes are zero-padded.
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/BrandedHost.js").BrandedHost} host - Host interface
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
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

	// Calculate gas costs
	const accessCost = 700n; // Simplified (Tangerine Whistle+)
	const copyCost = copyGasCost(len);
	const endBytes = dest + len;
	const memCost = memoryExpansionCost(frame, endBytes);

	// Charge all costs at once
	const gasErr = consumeGas(frame, accessCost + copyCost + memCost);
	if (gasErr) return gasErr;

	// Get the code from the external address
	const code = host.getCode(addr);

	// Copy code to memory
	for (let i = 0; i < len; i++) {
		const destAddResult = addU32(dest, i);
		if (destAddResult.error) return destAddResult.error;
		const dstIdx = destAddResult.value;

		const srcIdx = off + i;
		const byte = srcIdx < code.length ? code[srcIdx] : 0;
		writeMemory(frame, dstIdx, byte);
	}

	frame.pc += 1;
	return null;
}
