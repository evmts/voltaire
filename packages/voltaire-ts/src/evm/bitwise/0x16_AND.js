/**
 * AND opcode (0x16) - Bitwise AND
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
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
	if (a === undefined) return { type: "StackUnderflow" };
	const b = frame.stack.pop();
	if (b === undefined) return { type: "StackUnderflow" };

	// Bitwise AND
	const result = a & b;

	// Push result
	if (frame.stack.length >= 1024) return { type: "StackOverflow" };
	frame.stack.push(result);

	// Increment PC
	frame.pc += 1;

	return null;
}
