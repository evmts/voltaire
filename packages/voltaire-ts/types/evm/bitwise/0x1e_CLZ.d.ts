/**
 * CLZ opcode (0x1e) - Count leading zero bits (EIP-7939, Osaka+)
 *
 * Pops `x` and pushes the number of leading zero bits in its 256-bit
 * representation. `clz(0)` is 256.
 *
 * When `frame.hardfork` is set to a fork before Osaka the opcode is invalid.
 * A frame without a hardfork is treated as Osaka or later.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function handle(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x1e_CLZ.d.ts.map