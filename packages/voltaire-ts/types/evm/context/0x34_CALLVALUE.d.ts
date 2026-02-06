/**
 * CALLVALUE opcode (0x34) - Get deposited value by instruction/transaction responsible for this execution
 *
 * Stack: [] => [value]
 * Gas: 2 (GasQuickStep)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function callvalue(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x34_CALLVALUE.d.ts.map