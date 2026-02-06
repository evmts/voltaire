/**
 * LOG4 (0xa4) - Log with 4 topics
 *
 * Stack:
 *   in: offset, length, topic0, topic1, topic2, topic3
 *   out: -
 *
 * Gas: 375 (base) + 1500 (4 topics) + 8 * dataLength + memory expansion
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function handler_0xa4_LOG4(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0xa4_LOG4.d.ts.map