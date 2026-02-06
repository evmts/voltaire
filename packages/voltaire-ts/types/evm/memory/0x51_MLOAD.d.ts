/**
 * MLOAD opcode (0x51) - Load word from memory
 *
 * Pops offset from stack, reads 32 bytes from memory starting at offset,
 * and pushes the result as a 256-bit value onto the stack.
 *
 * Gas cost: GasFastestStep (3) + memory expansion cost
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function mload(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x51_MLOAD.d.ts.map