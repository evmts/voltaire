/**
 * LOG2 (0xa2) - Log with 2 topics
 *
 * Stack:
 *   in: offset, length, topic0, topic1
 *   out: -
 *
 * Gas: 375 (base) + 750 (2 topics) + 8 * dataLength + memory expansion
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function handler_0xa2_LOG2(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0xa2_LOG2.d.ts.map