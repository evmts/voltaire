/**
 * Calculate word-aligned memory size
 * @param {number} bytes - Byte count
 * @returns {number} Word-aligned size
 */
function wordAlignedSize(bytes) {
	const words = Math.ceil(bytes / 32);
	return words * 32;
}

/**
 * Write byte to memory
 *
 * @param {import("./BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {number} offset - Byte offset
 * @param {number} value - Byte value
 */
export function writeMemory(frame, offset, value) {
	frame.memory.set(offset, value & 0xff);
	const endOffset = offset + 1;
	const newSize = wordAlignedSize(endOffset);
	if (newSize > frame.memorySize) {
		frame.memorySize = newSize;
	}
}
