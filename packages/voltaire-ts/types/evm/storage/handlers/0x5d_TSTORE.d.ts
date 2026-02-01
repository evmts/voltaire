/**
 * TSTORE (0x5d) - Save word to transient storage
 *
 * Stack:
 *   in: key, value
 *   out: -
 *
 * Gas: 100
 *
 * EIP-1153: Transient storage opcodes (Cancun hardfork)
 * - Transaction-scoped storage, cleared at end of transaction
 * - No refunds or complex gas metering
 * - Cannot be called in static context
 *
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../../Host/HostType.js").BrandedHost} host - Host interface
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if any
 */
export function tstore(frame: import("../../Frame/FrameType.js").BrandedFrame, host: import("../../Host/HostType.js").BrandedHost): import("../../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x5d_TSTORE.d.ts.map