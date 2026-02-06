/**
 * MCOPY opcode (0x5e) - Copy memory (EIP-5656, Cancun+)
 *
 * Pops dest, src, len from stack. Copies len bytes from src to dest.
 * Handles overlapping regions correctly using temporary buffer.
 *
 * Gas cost: GasFastestStep (3) + memory expansion cost + copy cost (3 gas per word)
 *
 * Note: This opcode was introduced in the Cancun hardfork (EIP-5656).
 * Implementation assumes hardfork check is done externally.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function mcopy(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x5e_MCOPY.d.ts.map