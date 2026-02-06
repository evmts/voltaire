/**
 * SLOAD (0x54) - Load word from storage
 *
 * Stack:
 *   in: key
 *   out: value
 *
 * Gas: 100 (warm) or 2100 (cold) - EIP-2929
 *
 * EIP-2929 (Berlin+): Warm/cold storage access tracking
 * - First access to slot: 2100 gas (cold)
 * - Subsequent accesses: 100 gas (warm)
 * - Slot is marked warm for rest of transaction
 *
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../../Host/HostType.js").BrandedHost} host - Host interface
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if any
 */
export function sload(frame: import("../../Frame/FrameType.js").BrandedFrame, host: import("../../Host/HostType.js").BrandedHost): import("../../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x54_SLOAD.d.ts.map