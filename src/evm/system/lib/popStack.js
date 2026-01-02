/**
 * Pop a value from the stack
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame
 * @returns {{value: bigint, error: null} | {value: null, error: import("../../Frame/FrameType.js").EvmError}}
 */
export function popStack(frame) {
	if (frame.stack.length === 0) {
		return { value: null, error: { type: "StackUnderflow" } };
	}
	const value = /** @type {bigint} */ (frame.stack.pop());
	return { value, error: null };
}
