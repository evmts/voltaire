/**
 * GASPRICE opcode (0x3a) - Get price of gas in current environment
 *
 * Stack: [] => [gasPrice]
 * Gas: 2 (GasQuickStep)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {bigint} gasPrice - Transaction gas price
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function gasprice(frame: import("../Frame/FrameType.js").BrandedFrame, gasPrice: bigint): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x3a_GASPRICE.d.ts.map