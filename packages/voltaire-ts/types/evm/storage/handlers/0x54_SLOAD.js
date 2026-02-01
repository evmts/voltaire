import { ColdSload, WarmStorageRead, } from "../../../primitives/GasConstants/constants.js";
import * as Hex from "../../../primitives/Hex/index.js";
import * as Frame from "../../Frame/index.js";
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
export function sload(frame, host) {
    // Pop key from stack
    const keyResult = Frame.popStack(frame);
    if (keyResult.error)
        return keyResult.error;
    const key = keyResult.value;
    // EIP-2929: Check if slot is warm or cold
    // Initialize accessed_storage_keys on first use
    if (!frame.accessedStorageKeys) {
        frame.accessedStorageKeys = new Map();
    }
    const storageKey = getStorageMapKey(frame.address, key);
    /** @type {bigint} */
    let gasCost = ColdSload;
    // If already accessed in this transaction, it's warm
    if (frame.accessedStorageKeys.has(storageKey)) {
        gasCost = WarmStorageRead;
    }
    else {
        // Mark slot as accessed (warm for subsequent accesses)
        frame.accessedStorageKeys.set(storageKey, true);
    }
    const gasError = Frame.consumeGas(frame, gasCost);
    if (gasError)
        return gasError;
    // Load from storage via host
    const value = host.getStorage(frame.address, key);
    // Push value onto stack
    const pushError = Frame.pushStack(frame, value);
    if (pushError)
        return pushError;
    frame.pc += 1;
    return null;
}
/**
 * Get consistent storage key for tracking accessed slots
 * @param {Uint8Array} address
 * @param {bigint} slot
 * @returns {string}
 */
function getStorageMapKey(address, slot) {
    return `${Hex.fromBytes(address).slice(2)}-${slot.toString(16)}`;
}
