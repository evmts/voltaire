/**
 * Push value onto stack
 *
 * @param {import("./FrameType.js").BrandedFrame} frame - Frame instance
 * @param {bigint} value - Value to push
 * @returns {import("./FrameType.js").EvmError | null} Error if stack overflow
 */
export function pushStack(frame, value) {
	if (frame.stack.length >= 1024) {
		return { type: "StackOverflow" };
	}
	frame.stack.push(value);
	return null;
}
