/**
 * EQ opcode (0x14) - Equality comparison
 *
 * Pops two values from stack and pushes 1 if they are equal, 0 otherwise.
 * Comparison is bitwise equality.
 *
 * Gas: 3 (GasFastestStep)
 * Stack: a b -> (a == b ? 1 : 0)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Execution frame
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handle(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x14_EQ.d.ts.map