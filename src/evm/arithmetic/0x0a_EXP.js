/**
 * EXP opcode (0x0a) - Exponential operation
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function exp(frame) {
	const resultBase = popStack(frame);
	if (resultBase.error) return resultBase.error;
	const base = resultBase.value;

	const resultExponent = popStack(frame);
	if (resultExponent.error) return resultExponent.error;
	const exponent = resultExponent.value;

	// Calculate dynamic gas cost based on exponent byte length
	// Per EIP-160: GAS_EXP_BYTE * byte_length(exponent)
	let byteLen = 0n;
	if (exponent !== 0n) {
		let tempExp = exponent;
		while (tempExp > 0n) {
			byteLen += 1n;
			tempExp >>= 8n;
		}
	}
	// EIP-160: GAS_EXPONENTIATION_PER_BYTE = 50
	const EXP_BYTE_COST = 50n;
	const dynamicGas = EXP_BYTE_COST * byteLen;
	const gasErr = consumeGas(frame, 10n + dynamicGas);
	if (gasErr) return gasErr;

	// Compute result (wrapping on overflow)
	let result = 1n;
	let b = base;
	let e = exponent;
	while (e > 0n) {
		if ((e & 1n) === 1n) {
			result = (result * b) & ((1n << 256n) - 1n);
		}
		b = (b * b) & ((1n << 256n) - 1n);
		e >>= 1n;
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
