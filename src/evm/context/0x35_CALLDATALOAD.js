import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";

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
 * CALLDATALOAD opcode (0x35) - Get input data of current environment
 *
 * Stack: [offset] => [data]
 * Gas: 3 (GasFastestStep)
 *
 * Loads 32 bytes from calldata starting at offset. If offset + i >= calldata.length,
 * remaining bytes are zero-padded.
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function calldataload(frame) {
	const gasErr = consumeGas(frame, 3n);
	if (gasErr) return gasErr;

	const offsetResult = popStack(frame);
	if (offsetResult.error) return offsetResult.error;
	const offset = offsetResult.value;

	if (offset > 0xffffffff) {
		// Offset beyond reasonable range, return zero
		const pushErr = pushStack(frame, 0n);
		if (pushErr) return pushErr;
	} else {
		const off = Number(offset);
		let result = 0n;
		for (let i = 0; i < 32; i++) {
			const addResult = addU32(off, i);
			if (addResult.error) return addResult.error;
			const idx = addResult.value;
			const byte = idx < frame.calldata.length ? frame.calldata[idx] : 0;
			result = (result << 8n) | BigInt(byte);
		}
		const pushErr = pushStack(frame, result);
		if (pushErr) return pushErr;
	}

	frame.pc += 1;
	return null;
}
