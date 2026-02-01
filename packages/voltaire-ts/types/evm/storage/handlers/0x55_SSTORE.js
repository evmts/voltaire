import { ColdSload, SstoreRefund, SstoreReset, SstoreSentry, SstoreSet, WarmStorageRead, } from "../../../primitives/GasConstants/constants.js";
import * as Hex from "../../../primitives/Hex/index.js";
import * as Frame from "../../Frame/index.js";
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
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: opcode implementation
export function sstore(frame, host) {
    // EIP-214: Cannot modify state in static call
    if (frame.isStatic) {
        return { type: "WriteProtection" };
    }
    // Pop key and value from stack
    // Stack order: ... value key (key on top)
    const keyResult = Frame.popStack(frame);
    if (keyResult.error)
        return keyResult.error;
    const key = keyResult.value;
    const valueResult = Frame.popStack(frame);
    if (valueResult.error)
        return valueResult.error;
    const value = valueResult.value;
    // Get current value for gas calculation
    const currentValue = host.getStorage(frame.address, key);
    // Initialize tracking structures on first use
    if (!frame.accessedStorageKeys) {
        frame.accessedStorageKeys = new Map();
    }
    if (!frame.storageOriginalValues) {
        frame.storageOriginalValues = new Map();
    }
    if (!frame.gasRefunds) {
        frame.gasRefunds = 0n;
    }
    const storageKey = getStorageMapKey(frame.address, key);
    // Track original value (on first write to slot in transaction)
    if (!frame.storageOriginalValues.has(storageKey)) {
        frame.storageOriginalValues.set(storageKey, currentValue);
    }
    const originalValue = frame.storageOriginalValues.get(storageKey);
    // EIP-2200 (Istanbul+): Sentry check (requires >= 2300 gas)
    // Note: Simplified - assume Istanbul is active if accessed structures exist
    const requiresSentry = true;
    if (requiresSentry && frame.gasRemaining <= SstoreSentry) {
        return { type: "OutOfGas" };
    }
    // Calculate gas cost based on value changes
    let gasCost = 0n;
    let isColdSlot = false;
    // Check if this is a cold slot access (EIP-2929)
    if (frame.accessedStorageKeys.has(storageKey)) {
        // Warm slot: 100 gas
        gasCost = 100n;
    }
    else {
        // Cold slot: 2100 gas (cold access cost)
        gasCost = 2100n;
        isColdSlot = true;
        frame.accessedStorageKeys.set(storageKey, true);
    }
    // Refund calculation (EIP-2200/EIP-3529)
    // Only calculate refunds if value actually changes
    if (currentValue !== value) {
        // Case 1: Clearing storage (original != 0, current != 0, value == 0)
        if (originalValue !== 0n && currentValue !== 0n && value === 0n) {
            frame.gasRefunds += SstoreRefund; // 4800 (London+) or 15000 (Istanbul)
        }
        // Case 2: Reversing a previous clear (original != 0, current == 0)
        if (originalValue !== 0n && currentValue === 0n) {
            // Subtract the refund that was given earlier
            if (frame.gasRefunds >= SstoreRefund) {
                frame.gasRefunds -= SstoreRefund;
            }
        }
        // Case 3: Restoring to original value
        if (originalValue === value) {
            if (originalValue === 0n) {
                // Was originally empty, SET cost 20000, restored to 0
                // Refund: 20000 - 100 = 19900
                frame.gasRefunds += SstoreSet - WarmStorageRead;
            }
            else {
                // Was originally non-empty, RESET cost 5000, restored to original
                // Refund: 5000 - 2100 - 100 = 2800
                frame.gasRefunds += SstoreReset - ColdSload - WarmStorageRead;
            }
        }
    }
    // Add cold slot access cost if needed
    if (isColdSlot) {
        gasCost += 2000n; // Additional cold access cost (brings 100 to 2100)
    }
    // Determine base cost (same as basic logic)
    if (currentValue === 0n && value !== 0n) {
        gasCost += SstoreSet; // 20000
    }
    else {
        gasCost += SstoreReset; // 5000
    }
    const gasError = Frame.consumeGas(frame, gasCost);
    if (gasError)
        return gasError;
    // Store value via host
    host.setStorage(frame.address, key, value);
    frame.pc += 1;
    return null;
}
/**
 * Get consistent storage key for tracking accessed slots and original values
 * @param {Uint8Array} address
 * @param {bigint} slot
 * @returns {string}
 */
function getStorageMapKey(address, slot) {
    return `${Hex.fromBytes(address).slice(2)}-${slot.toString(16)}`;
}
