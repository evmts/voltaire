/**
 * LT opcode (0x10) - Less than comparison (unsigned)
 *
 * Pops two values from stack and pushes 1 if first < second, 0 otherwise.
 * All comparisons are unsigned 256-bit integers.
 *
 * Gas: 3 (GasFastestStep)
 * Stack: a b -> (a < b ? 1 : 0)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Execution frame
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handle(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x10_LT.d.ts.map