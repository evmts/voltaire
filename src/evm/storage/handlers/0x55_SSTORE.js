import * as Frame from "../../Frame/index.js";
import {
	SstoreSentry,
	SstoreSet,
	SstoreReset,
	SstoreRefund,
	WarmStorageRead,
	ColdSload,
} from "../../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * SSTORE (0x55) - Save word to storage
 *
 * Stack:
 *   in: key, value
 *   out: -
 *
 * Gas: Complex - EIP-2200 (Istanbul+) / EIP-2929 (Berlin+) / EIP-3529 (London+)
 *
 * EIP-2200 Rules (Istanbul+):
 * - Sentry: Requires >= 2300 gas remaining
 * - Cost varies based on current vs original value
 * - Refunds for clearing and restoring values
 *
 * Pre-Istanbul:
 * - Zero to non-zero: 20000 gas
 * - Otherwise: 5000 gas
 * - Refund 15000 when clearing
 *
 * @param {import("../../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {import("../../Host/BrandedHost.js").BrandedHost} host - Host interface
 * @returns {import("../../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function sstore(frame, host) {
	// EIP-214: Cannot modify state in static call
	if (frame.isStatic) {
		return { type: "WriteProtection" };
	}

	// TODO: EIP-2200 sentry check (requires hardfork awareness)
	// For now, simplified pre-Istanbul behavior

	// Pop key and value from stack
	const keyResult = Frame.popStack(frame);
	if (keyResult.error) return keyResult.error;
	const key = keyResult.value;

	const valueResult = Frame.popStack(frame);
	if (valueResult.error) return valueResult.error;
	const value = valueResult.value;

	// Get current value for gas calculation
	const currentValue = host.getStorage(frame.address, key);

	// Simplified pre-Istanbul gas calculation
	// TODO: Implement full EIP-2200/2929/3529 logic with:
	// - Original value tracking (getOriginal)
	// - Access list for cold/warm slots
	// - Hardfork-dependent gas costs and refunds
	const gasCost = currentValue === 0n && value !== 0n ? SstoreSet : SstoreReset;

	const gasError = Frame.consumeGas(frame, gasCost);
	if (gasError) return gasError;

	// TODO: Implement refund logic
	// Pre-Istanbul: 15000 gas refund when clearing (current != 0, value == 0)
	// Istanbul-London: EIP-2200 complex refunds
	// London+: EIP-3529 reduced refunds (4800 for clear)

	// Store value via host
	host.setStorage(frame.address, key, value);

	frame.pc += 1;
	return null;
}
