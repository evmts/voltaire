/**
 * ORIGIN opcode (0x32) - Get execution origination address
 *
 * Stack: [] => [origin]
 * Gas: 2 (GasQuickStep)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../../primitives/Address/AddressType.js").AddressType} origin - Transaction origin address
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function origin(frame: import("../Frame/FrameType.js").BrandedFrame, origin: import("../../primitives/Address/AddressType.js").AddressType): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x32_ORIGIN.d.ts.map