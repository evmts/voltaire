/**
 * BLOBBASEFEE opcode (0x4a) - Get blob base fee (EIP-7516, Cancun+)
 *
 * Per Python reference (cancun/vm/gas.py and BlobBaseFeeGas constant):
 * - GAS_BASE = 2 (same as GasQuickStep)
 * - Returns blob_base_fee calculated from excess_blob_gas
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x4a_BLOBBASEFEE(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x4a_BLOBBASEFEE.d.ts.map