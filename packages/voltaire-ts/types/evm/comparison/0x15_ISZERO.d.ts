/**
 * ISZERO opcode (0x15) - Check if value is zero
 *
 * Pops one value from stack and pushes 1 if it is zero, 0 otherwise.
 *
 * Gas: 3 (GasFastestStep)
 * Stack: a -> (a == 0 ? 1 : 0)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Execution frame
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handle(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x15_ISZERO.d.ts.map