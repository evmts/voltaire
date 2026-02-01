/**
 * SSTORE (0x55) - Save word to storage
 *
 * Stack:
 *   in: key, value
 *   out: -
 *
 * Gas: Complex - EIP-2200 (Istanbul+) / EIP-2929 (Berlin+) / EIP-3529 (London+)
 *
 * EIP-2200 (Istanbul+):
 * - Sentry: Requires >= 2300 gas remaining
 * - Cost varies based on current vs original value
 * - Refunds for clearing and restoring values
 *
 * EIP-2929 (Berlin+):
 * - Cold/warm storage slot tracking
 * - Cold slot access adds 2000 gas (100 -> 2100 for first access)
 *
 * EIP-3529 (London+):
 * - Reduced refunds: 4800 instead of 15000 for clearing
 * - Max refund capped at 20% of tx gas
 *
 * Pre-Istanbul:
 * - Zero to non-zero: 20000 gas
 * - Otherwise: 5000 gas
 * - Refund 15000 when clearing
 *
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../../Host/HostType.js").BrandedHost} host - Host interface
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if any
 */
export function sstore(frame: import("../../Frame/FrameType.js").BrandedFrame, host: import("../../Host/HostType.js").BrandedHost): import("../../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x55_SSTORE.d.ts.map