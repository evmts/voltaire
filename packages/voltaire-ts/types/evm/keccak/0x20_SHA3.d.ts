/**
 * SHA3 opcode (0x20) - Compute Keccak-256 hash
 *
 * Pops offset and length from stack, reads data from memory,
 * computes Keccak-256 hash, and pushes the 32-byte result.
 *
 * Gas cost: 30 (base) + 6 * word_count + memory expansion
 * where word_count = ceil(length / 32)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function sha3(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x20_SHA3.d.ts.map