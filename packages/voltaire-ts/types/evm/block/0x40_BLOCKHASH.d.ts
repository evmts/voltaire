/**
 * BLOCKHASH opcode (0x40) - Get hash of recent block
 *
 * Per Python reference (cancun/vm/instructions/block.py:21-64):
 * - Charges GAS_BLOCK_HASH (20 gas)
 * - Returns hash of one of the 256 most recent complete blocks
 * - Returns 0 if block number is out of range (too old or >= current)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x40_BLOCKHASH(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x40_BLOCKHASH.d.ts.map