/**
 * Peek at stack value without removing
 *
 * @param {import("./FrameType.js").BrandedFrame} frame - Frame instance
 * @param {number} index - Index from top (0 = top)
 * @returns {{value: bigint, error: null} | {value: null, error: import("./FrameType.js").EvmError}} Result or error
 */
export function peekStack(frame, index) {
	if (index >= frame.stack.length) {
		return { value: null, error: { type: "StackUnderflow" } };
	}
	const value = /** @type {bigint} */ (
		frame.stack[frame.stack.length - 1 - index]
	);
	return { value, error: null };
}
