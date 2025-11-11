/**
 * Pop value from stack
 *
 * @param {import("./BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {{value: bigint, error: null} | {value: null, error: import("./BrandedFrame.js").EvmError}} Result or error
 */
export function popStack(frame) {
	if (frame.stack.length === 0) {
		return { value: null, error: { type: "StackUnderflow" } };
	}
	const value = frame.stack.pop();
	return { value, error: null };
}
