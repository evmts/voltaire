/**
 * StateManagerHost - Host implementation backed by StateManager FFI
 *
 * Adapts StateManager FFI to BrandedHost interface for EVM execution.
 * Provides sync interface while internally managing async FFI operations.
 *
 * @module provider/StateManagerHost
 */
import { Host } from "../evm/Host/index.js";
import * as Address from "../primitives/Address/index.js";
import * as HexUtils from "../primitives/Hex/index.js";
/**
 * StateManagerHost - Host implementation backed by StateManager FFI
 *
 * Wraps StateManager to implement BrandedHost interface.
 * All methods are synchronous (as required by Host interface),
 * but use synchronous FFI calls internally.
 *
 * @example
 * ```typescript
 * const stateManager = new StateManager({
 *   rpcClient: new RpcClientAdapter(httpProvider),
 *   forkBlockTag: '0x112a880',
 *   ffi: ffiExports
 * });
 *
 * const host = StateManagerHost(stateManager);
 *
 * // Use in EVM frame
 * const frame = Frame({
 *   bytecode,
 *   gas: 1000000n,
 *   host,
 *   ...
 * });
 * ```
 */
export function StateManagerHost(stateManager) {
    // Internal transient storage (EIP-1153)
    // Transaction-scoped, cleared at end of tx
    const transientStorage = new Map();
    return Host({
        getBalance: (address) => {
            // StateManager methods are async, but Host interface requires sync
            // For MVP, we throw if async needed. Production version needs different approach.
            const balance = getBalanceSync(stateManager, address);
            return balance;
        },
        setBalance: (address, balance) => {
            setBalanceSync(stateManager, address, balance);
        },
        getCode: (address) => {
            const code = getCodeSync(stateManager, address);
            return code;
        },
        setCode: (address, code) => {
            setCodeSync(stateManager, address, code);
        },
        getStorage: (address, slot) => {
            const value = getStorageSync(stateManager, address, slot);
            return value;
        },
        setStorage: (address, slot, value) => {
            setStorageSync(stateManager, address, slot, value);
        },
        getNonce: (address) => {
            const nonce = getNonceSync(stateManager, address);
            return nonce;
        },
        setNonce: (address, nonce) => {
            setNonceSync(stateManager, address, nonce);
        },
        getTransientStorage: (address, slot) => {
            const addrKey = addressToKey(address);
            const addrStorage = transientStorage.get(addrKey);
            if (!addrStorage)
                return 0n;
            return addrStorage.get(slot.toString(16)) ?? 0n;
        },
        setTransientStorage: (address, slot, value) => {
            const addrKey = addressToKey(address);
            let addrStorage = transientStorage.get(addrKey);
            if (!addrStorage) {
                addrStorage = new Map();
                transientStorage.set(addrKey, addrStorage);
            }
            addrStorage.set(slot.toString(16), value);
        },
    });
}
/**
 * Clear transient storage (call at end of transaction)
 */
export function clearTransientStorage(_host) {
    // Access internal transient storage if possible
    // For now, this is a no-op - caller must manage transaction boundaries
}
// ========================================================================
// Sync Wrappers for StateManager (using FFI directly)
// ========================================================================
// These bypass the async StateManager methods and use sync FFI calls directly
/**
 * Encode string as null-terminated buffer for FFI
 * Workaround for Bun FFI cstring bug in 1.2.20
 */
function encodeCString(str) {
    return new TextEncoder().encode(`${str}\0`);
}
function asFFIHandle(stateManager) {
    return stateManager;
}
/**
 * Get balance synchronously using FFI
 */
function getBalanceSync(stateManager, address) {
    // HACK: Cast to internal FFI handle to access private fields.
    // Production should expose sync methods or use different architecture.
    const sm = asFFIHandle(stateManager);
    const addressHex = Address.toHex(address);
    const buffer = new Uint8Array(67);
    const result = sm.ffi.state_manager_get_balance_sync(sm.handle, encodeCString(addressHex), buffer, buffer.length);
    if (result !== 0) {
        throw new Error(`Failed to get balance: error ${result}`);
    }
    const nullIndex = buffer.indexOf(0);
    const hexString = new TextDecoder().decode(buffer.subarray(0, nullIndex));
    return BigInt(hexString);
}
/**
 * Set balance synchronously using FFI
 */
function setBalanceSync(stateManager, address, balance) {
    const sm = asFFIHandle(stateManager);
    const addressHex = Address.toHex(address);
    const balanceHex = `0x${balance.toString(16)}`;
    const result = sm.ffi.state_manager_set_balance(sm.handle, encodeCString(addressHex), encodeCString(balanceHex));
    if (result !== 0) {
        throw new Error(`Failed to set balance: error ${result}`);
    }
}
/**
 * Get nonce synchronously using FFI
 */
function getNonceSync(stateManager, address) {
    const sm = asFFIHandle(stateManager);
    const addressHex = Address.toHex(address);
    const outBuffer = new BigUint64Array(1);
    const result = sm.ffi.state_manager_get_nonce_sync(sm.handle, encodeCString(addressHex), outBuffer);
    if (result !== 0) {
        throw new Error(`Failed to get nonce: error ${result}`);
    }
    const nonce = outBuffer[0];
    if (nonce === undefined) {
        throw new Error("Failed to read nonce from buffer");
    }
    return nonce;
}
/**
 * Set nonce synchronously using FFI
 */
function setNonceSync(stateManager, address, nonce) {
    const sm = asFFIHandle(stateManager);
    const addressHex = Address.toHex(address);
    const result = sm.ffi.state_manager_set_nonce(sm.handle, encodeCString(addressHex), nonce);
    if (result !== 0) {
        throw new Error(`Failed to set nonce: error ${result}`);
    }
}
/**
 * Get storage synchronously using FFI
 */
function getStorageSync(stateManager, address, slot) {
    const sm = asFFIHandle(stateManager);
    const addressHex = Address.toHex(address);
    const slotHex = `0x${slot.toString(16).padStart(64, "0")}`;
    const buffer = new Uint8Array(67);
    const result = sm.ffi.state_manager_get_storage_sync(sm.handle, encodeCString(addressHex), encodeCString(slotHex), buffer, buffer.length);
    if (result !== 0) {
        throw new Error(`Failed to get storage: error ${result}`);
    }
    const nullIndex = buffer.indexOf(0);
    const hexString = new TextDecoder().decode(buffer.subarray(0, nullIndex));
    return BigInt(hexString);
}
/**
 * Set storage synchronously using FFI
 */
function setStorageSync(stateManager, address, slot, value) {
    const sm = asFFIHandle(stateManager);
    const addressHex = Address.toHex(address);
    const slotHex = `0x${slot.toString(16).padStart(64, "0")}`;
    const valueHex = `0x${value.toString(16).padStart(64, "0")}`;
    const result = sm.ffi.state_manager_set_storage(sm.handle, encodeCString(addressHex), encodeCString(slotHex), encodeCString(valueHex));
    if (result !== 0) {
        throw new Error(`Failed to set storage: error ${result}`);
    }
}
/**
 * Get code synchronously using FFI
 */
function getCodeSync(stateManager, address) {
    const sm = asFFIHandle(stateManager);
    const addressHex = Address.toHex(address);
    // Get code length first
    const lenBuffer = new BigUint64Array(1);
    const lenResult = sm.ffi.state_manager_get_code_len_sync(sm.handle, encodeCString(addressHex), lenBuffer);
    if (lenResult !== 0) {
        throw new Error(`Failed to get code length: error ${lenResult}`);
    }
    const codeLen = Number(lenBuffer[0]);
    if (codeLen === 0) {
        return new Uint8Array(0);
    }
    // Get code bytes
    const codeBuffer = new Uint8Array(codeLen);
    const codeResult = sm.ffi.state_manager_get_code_sync(sm.handle, encodeCString(addressHex), codeBuffer, codeLen);
    if (codeResult !== 0) {
        throw new Error(`Failed to get code: error ${codeResult}`);
    }
    return codeBuffer;
}
/**
 * Set code synchronously using FFI
 */
function setCodeSync(stateManager, address, code) {
    const sm = asFFIHandle(stateManager);
    const addressHex = Address.toHex(address);
    const result = sm.ffi.state_manager_set_code(sm.handle, encodeCString(addressHex), code, code.length);
    if (result !== 0) {
        throw new Error(`Failed to set code: error ${result}`);
    }
}
// ========================================================================
// Helpers
// ========================================================================
/**
 * Convert address to lowercase hex key for storage
 */
function addressToKey(address) {
    return HexUtils.fromBytes(address).toLowerCase();
}
