/**
 * SGT opcode (0x13) - Signed greater than comparison
 *
 * Pops two values from stack and pushes 1 if first > second (signed), 0 otherwise.
 * Values are interpreted as signed 256-bit two's complement integers.
 *
 * Gas: 3 (GasFastestStep)
 * Stack: a b -> (signed(a) > signed(b) ? 1 : 0)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Execution frame
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handle(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x13_SGT.d.ts.map