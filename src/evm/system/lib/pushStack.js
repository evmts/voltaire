/**
 * Push a value onto the stack
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame
 * @param {bigint} value
 * @returns {import("../../Frame/FrameType.js").EvmError | null}
 */
export function pushStack(frame, value) {
	if (frame.stack.length >= 1024) {
		return { type: "StackOverflow" };
	}
	frame.stack.push(value);
	return null;
}
