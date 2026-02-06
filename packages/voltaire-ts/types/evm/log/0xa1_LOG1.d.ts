/**
 * LOG1 (0xa1) - Log with 1 topic
 *
 * Stack:
 *   in: offset, length, topic0
 *   out: -
 *
 * Gas: 375 (base) + 375 (topic) + 8 * dataLength + memory expansion
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function handler_0xa1_LOG1(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0xa1_LOG1.d.ts.map