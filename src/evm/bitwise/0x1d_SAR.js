/**
 * SAR opcode (0x1d) - Arithmetic shift right (EIP-145, Constantinople+)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function handle(frame) {
	// Consume gas (GasFastestStep = 3)
	frame.gasRemaining -= 3n;
	if (frame.gasRemaining < 0n) {
		frame.gasRemaining = 0n;
		return { type: "OutOfGas" };
	}

	// Pop operands: shift amount, then value
	if (frame.stack.length < 2) return { type: "StackUnderflow" };
	const shift = frame.stack.pop();
	const value = frame.stack.pop();

	// Convert to signed for arithmetic shift
	const MIN_SIGNED = 1n << 255n;
	const valueSigned = value >= MIN_SIGNED ? value - (1n << 256n) : value;

	let result;
	if (shift >= 256n) {
		// If negative, result is all 1s (-1); if positive, 0
		result = valueSigned < 0n ? (1n << 256n) - 1n : 0n;
	} else {
		// Arithmetic shift right
		const shifted = valueSigned >> shift;
		result = shifted < 0n ? (1n << 256n) + shifted : shifted;
	}

	// Push result
	if (frame.stack.length >= 1024) return { type: "StackOverflow" };
	frame.stack.push(result);

	// Increment PC
	frame.pc += 1;

	return null;
}
