/**
 * RETURNDATASIZE opcode (0x3d) - Get size of output data from the previous call
 *
 * Stack: [] => [size]
 * Gas: 2 (GasQuickStep)
 *
 * EIP-211: Introduced in Byzantium hardfork
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function returndatasize(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x3d_RETURNDATASIZE.d.ts.map