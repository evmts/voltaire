/**
 * TLOAD (0x5c) - Load word from transient storage
 *
 * Stack:
 *   in: key
 *   out: value
 *
 * Gas: 100
 *
 * EIP-1153: Transient storage opcodes (Cancun hardfork)
 * - Transaction-scoped storage, cleared at end of transaction
 * - No refunds or complex gas metering
 *
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../../Host/HostType.js").BrandedHost} host - Host interface
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if any
 */
export function tload(frame: import("../../Frame/FrameType.js").BrandedFrame, host: import("../../Host/HostType.js").BrandedHost): import("../../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x5c_TLOAD.d.ts.map