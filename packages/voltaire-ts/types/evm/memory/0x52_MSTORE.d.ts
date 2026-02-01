/**
 * MSTORE opcode (0x52) - Save word to memory
 *
 * Pops offset and value from stack, writes 32 bytes to memory starting at offset.
 * Value is stored in big-endian format.
 *
 * Gas cost: GasFastestStep (3) + memory expansion cost
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function mstore(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x52_MSTORE.d.ts.map