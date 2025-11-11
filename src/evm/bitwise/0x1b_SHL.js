/**
 * SHL opcode (0x1b) - Shift left (EIP-145, Constantinople+)
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

	// For shifts >= 256, result is 0; else shift left and mask to 256 bits
	const result = shift >= 256n ? 0n : (value << shift) & ((1n << 256n) - 1n);

	// Push result
	if (frame.stack.length >= 1024) return { type: "StackOverflow" };
	frame.stack.push(result);

	// Increment PC
	frame.pc += 1;

	return null;
}
