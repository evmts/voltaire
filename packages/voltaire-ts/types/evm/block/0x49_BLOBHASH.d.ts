/**
 * BLOBHASH opcode (0x49) - Get versioned blob hash (EIP-4844, Cancun+)
 *
 * Per Python reference (cancun/vm/gas.py:68):
 * - GAS_BLOBHASH_OPCODE = 3 (same as GasFastestStep)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x49_BLOBHASH(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x49_BLOBHASH.d.ts.map