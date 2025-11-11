/**
 * STOP opcode (0x00) - Halt execution
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x00_STOP(frame) {
	frame.stopped = true;
	return null;
}
