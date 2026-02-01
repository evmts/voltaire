/**
 * LOG0 (0xa0) - Log with 0 topics
 *
 * Stack:
 *   in: offset, length
 *   out: -
 *
 * Gas: 375 (base) + 8 * dataLength + memory expansion
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function handler_0xa0_LOG0(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0xa0_LOG0.d.ts.map