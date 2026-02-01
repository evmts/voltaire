/**
 * Read byte from memory
 *
 * @param {import("./FrameType.js").BrandedFrame} frame - Frame instance
 * @param {number} offset - Byte offset
 * @returns {number} Byte value (0 if uninitialized)
 */
export function readMemory(frame, offset) {
    return frame.memory.get(offset) ?? 0;
}
