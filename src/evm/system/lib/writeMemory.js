/**
 * Write a byte to memory
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame
 * @param {number} offset
 * @param {number} value
 */
export function writeMemory(frame, offset, value) {
	frame.memory.set(offset, value);
}
