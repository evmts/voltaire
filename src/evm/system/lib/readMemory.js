/**
 * Read a byte from memory
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame
 * @param {number} offset
 * @returns {number}
 */
export function readMemory(frame, offset) {
	return frame.memory.get(offset) ?? 0;
}
