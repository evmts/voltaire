/**
 * Peek at stack value without removing
 *
 * @param {import("./FrameType.js").BrandedFrame} frame - Frame instance
 * @param {number} index - Index from top (0 = top)
 * @returns {{value: bigint, error: null} | {value: null, error: import("./FrameType.js").EvmError}} Result or error
 */
export function peekStack(frame: import("./FrameType.js").BrandedFrame, index: number): {
    value: bigint;
    error: null;
} | {
    value: null;
    error: import("./FrameType.js").EvmError;
};
//# sourceMappingURL=peekStack.d.ts.map