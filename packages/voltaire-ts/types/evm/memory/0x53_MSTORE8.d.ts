/**
 * MSTORE8 opcode (0x53) - Save byte to memory
 *
 * Pops offset and value from stack, writes the least significant byte
 * of value to memory at offset.
 *
 * Gas cost: GasFastestStep (3) + memory expansion cost
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function mstore8(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x53_MSTORE8.d.ts.map