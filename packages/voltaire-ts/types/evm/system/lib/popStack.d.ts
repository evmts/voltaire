/**
 * Pop a value from the stack
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame
 * @returns {{value: bigint, error: null} | {value: null, error: import("../../Frame/FrameType.js").EvmError}}
 */
export function popStack(frame: import("../../Frame/FrameType.js").BrandedFrame): {
    value: bigint;
    error: null;
} | {
    value: null;
    error: import("../../Frame/FrameType.js").EvmError;
};
//# sourceMappingURL=popStack.d.ts.map