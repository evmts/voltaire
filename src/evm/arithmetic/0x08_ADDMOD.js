/**
 * ADDMOD opcode (0x08) - Addition modulo n (mod by zero returns 0)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function addmod(frame) {
	const gasErr = consumeGas(frame, 8n);
	if (gasErr) return gasErr;

	const resultA = popStack(frame);
	if (resultA.error) return resultA.error;
	const a = resultA.value;

	const resultB = popStack(frame);
	if (resultB.error) return resultB.error;
	const b = resultB.value;

	const resultN = popStack(frame);
	if (resultN.error) return resultN.error;
	const n = resultN.value;

	let result;
	if (n === 0n) {
		result = 0n;
	} else {
		// No overflow needed - BigInt handles arbitrary precision
		result = (a + b) % n;
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
