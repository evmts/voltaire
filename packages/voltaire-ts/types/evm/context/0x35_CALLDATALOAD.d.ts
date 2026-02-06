/**
 * CALLDATALOAD opcode (0x35) - Get input data of current environment
 *
 * Stack: [offset] => [data]
 * Gas: 3 (GasFastestStep)
 *
 * Loads 32 bytes from calldata starting at offset. If offset + i >= calldata.length,
 * remaining bytes are zero-padded.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function calldataload(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x35_CALLDATALOAD.d.ts.map