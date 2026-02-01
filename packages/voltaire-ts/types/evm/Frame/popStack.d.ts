/**
 * Pop value from stack
 *
 * @param {import("./FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {{value: bigint, error: null} | {value: null, error: import("./FrameType.js").EvmError}} Result or error
 */
export function popStack(frame: import("./FrameType.js").BrandedFrame): {
    value: bigint;
    error: null;
} | {
    value: null;
    error: import("./FrameType.js").EvmError;
};
//# sourceMappingURL=popStack.d.ts.map