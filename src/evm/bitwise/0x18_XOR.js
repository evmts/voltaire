/**
 * XOR opcode (0x18) - Bitwise XOR
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

	// Pop operands
	if (frame.stack.length < 2) return { type: "StackUnderflow" };
	const a = frame.stack.pop();
	const b = frame.stack.pop();

	// Bitwise XOR
	const result = a ^ b;

	// Push result
	if (frame.stack.length >= 1024) return { type: "StackOverflow" };
	frame.stack.push(result);

	// Increment PC
	frame.pc += 1;

	return null;
}
