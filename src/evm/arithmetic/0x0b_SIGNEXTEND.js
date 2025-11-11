/**
 * SIGNEXTEND opcode (0x0b) - Sign extension
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function signextend(frame) {
	const gasErr = consumeGas(frame, 5n);
	if (gasErr) return gasErr;

	const resultByteIndex = popStack(frame);
	if (resultByteIndex.error) return resultByteIndex.error;
	const byteIndex = resultByteIndex.value;

	const resultValue = popStack(frame);
	if (resultValue.error) return resultValue.error;
	const value = resultValue.value;

	// If byte_index >= 31, no sign extension needed
	let result;
	if (byteIndex >= 31n) {
		result = value;
	} else {
		const bitIndex = Number(byteIndex * 8n + 7n);
		const signBit = 1n << BigInt(bitIndex);
		const mask = signBit - 1n;

		// Check if sign bit is set
		const isNegative = (value & signBit) !== 0n;

		if (isNegative) {
			// Sign extend with 1s
			result = value | ~mask;
		} else {
			// Zero extend (clear upper bits)
			result = value & mask;
		}
		// Ensure result is 256-bit
		result = result & ((1n << 256n) - 1n);
	}

	const pushErr = pushStack(frame, result);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}

/**
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame
 * @param {bigint} amount
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null}
 */
function consumeGas(frame, amount) {
	if (frame.gasRemaining < amount) {
		frame.gasRemaining = 0n;
		return { type: "OutOfGas" };
	}
	frame.gasRemaining -= amount;
	return null;
}

/**
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame
 * @returns {{value: bigint, error: null} | {value: null, error: import("../Frame/BrandedFrame.js").EvmError}}
 */
function popStack(frame) {
	if (frame.stack.length === 0) {
		return { value: null, error: { type: "StackUnderflow" } };
	}
	const value = frame.stack.pop();
	return { value, error: null };
}

/**
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame
 * @param {bigint} value
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null}
 */
function pushStack(frame, value) {
	if (frame.stack.length >= 1024) {
		return { type: "StackOverflow" };
	}
	frame.stack.push(value);
	return null;
}
