/**
 * SDIV opcode (0x05) - Signed integer division
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function sdiv(frame) {
	const gasErr = consumeGas(frame, 5n);
	if (gasErr) return gasErr;

	const resultTop = popStack(frame);
	if (resultTop.error) return resultTop.error;
	const top = resultTop.value;

	const resultSecond = popStack(frame);
	if (resultSecond.error) return resultSecond.error;
	const second = resultSecond.value;

	const MIN_SIGNED = 1n << 255n;
	const MAX_UNSIGNED = (1n << 256n) - 1n;

	let result;
	if (second === 0n) {
		result = 0n;
	} else if (top === MIN_SIGNED && second === MAX_UNSIGNED) {
		result = MIN_SIGNED;
	} else {
		// Convert to signed
		const topSigned = toSigned256(top);
		const secondSigned = toSigned256(second);
		// Truncating division
		const quotient = topSigned / secondSigned;
		// Convert back to unsigned
		result = toUnsigned256(quotient);
	}

	const pushErr = pushStack(frame, result);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}

/**
 * Convert u256 to i256 (two's complement)
 * @param {bigint} value
 * @returns {bigint}
 */
function toSigned256(value) {
	const MIN_SIGNED = 1n << 255n;
	if (value >= MIN_SIGNED) {
		return value - (1n << 256n);
	}
	return value;
}

/**
 * Convert i256 to u256 (two's complement)
 * @param {bigint} value
 * @returns {bigint}
 */
function toUnsigned256(value) {
	if (value < 0n) {
		return (1n << 256n) + value;
	}
	return value & ((1n << 256n) - 1n);
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
