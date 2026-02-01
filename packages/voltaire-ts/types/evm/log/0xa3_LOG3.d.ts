/**
 * LOG3 (0xa3) - Log with 3 topics
 *
 * Stack:
 *   in: offset, length, topic0, topic1, topic2
 *   out: -
 *
 * Gas: 375 (base) + 1125 (3 topics) + 8 * dataLength + memory expansion
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function handler_0xa3_LOG3(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0xa3_LOG3.d.ts.map