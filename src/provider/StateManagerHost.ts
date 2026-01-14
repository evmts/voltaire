/**
 * StateManagerHost - Host implementation backed by StateManager FFI
 *
 * Adapts StateManager FFI to BrandedHost interface for EVM execution.
 * Provides sync interface while internally managing async FFI operations.
 *
 * @module provider/StateManagerHost
 */

import type { BrandedHost } from "../evm/Host/HostType.js";
import { Host } from "../evm/Host/index.js";
import type { AddressType } from "../primitives/Address/AddressType.js";
import * as Address from "../primitives/Address/index.js";
import type { Hex } from "../primitives/Hex/HexType.js";
import * as HexUtils from "../primitives/Hex/index.js";
import type { StateManager } from "../state-manager/StateManager/index.js";

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
export function StateManagerHost(stateManager: StateManager): BrandedHost {
	// Internal transient storage (EIP-1153)
	// Transaction-scoped, cleared at end of tx
	const transientStorage = new Map<string, Map<string, bigint>>();

	return Host({
		getBalance: (address: AddressType): bigint => {
			// StateManager methods are async, but Host interface requires sync
			// For MVP, we throw if async needed. Production version needs different approach.
			const balance = getBalanceSync(stateManager, address);
			return balance;
		},

		setBalance: (address: AddressType, balance: bigint): void => {
			setBalanceSync(stateManager, address, balance);
		},

		getCode: (address: AddressType): Uint8Array => {
			const code = getCodeSync(stateManager, address);
			return code;
		},

		setCode: (address: AddressType, code: Uint8Array): void => {
			setCodeSync(stateManager, address, code);
		},

		getStorage: (address: AddressType, slot: bigint): bigint => {
			const value = getStorageSync(stateManager, address, slot);
			return value;
		},

		setStorage: (address: AddressType, slot: bigint, value: bigint): void => {
			setStorageSync(stateManager, address, slot, value);
		},

		getNonce: (address: AddressType): bigint => {
			const nonce = getNonceSync(stateManager, address);
			return nonce;
		},

		setNonce: (address: AddressType, nonce: bigint): void => {
			setNonceSync(stateManager, address, nonce);
		},

		getTransientStorage: (address: AddressType, slot: bigint): bigint => {
			const addrKey = addressToKey(address);
			const addrStorage = transientStorage.get(addrKey);
			if (!addrStorage) return 0n;
			return addrStorage.get(slot.toString(16)) ?? 0n;
		},

		setTransientStorage: (
			address: AddressType,
			slot: bigint,
			value: bigint,
		): void => {
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
export function clearTransientStorage(_host: BrandedHost): void {
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
function encodeCString(str: string): Uint8Array {
	return new TextEncoder().encode(`${str}\0`);
}

/**
 * Get balance synchronously using FFI
 */
function getBalanceSync(
	stateManager: StateManager,
	address: AddressType,
): bigint {
	// HACK: Cast to any to access private ffi and handle
	// Production should expose sync methods or use different architecture
	const sm = stateManager as any;
	const addressHex = Address.toHex(address);
	const buffer = new Uint8Array(67);

	const result = sm.ffi.state_manager_get_balance_sync(
		sm.handle,
		encodeCString(addressHex) as unknown as string,
		buffer,
		buffer.length,
	);

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
function setBalanceSync(
	stateManager: StateManager,
	address: AddressType,
	balance: bigint,
): void {
	const sm = stateManager as any;
	const addressHex = Address.toHex(address);
	const balanceHex = `0x${balance.toString(16)}`;

	const result = sm.ffi.state_manager_set_balance(
		sm.handle,
		encodeCString(addressHex) as unknown as string,
		encodeCString(balanceHex) as unknown as string,
	);

	if (result !== 0) {
		throw new Error(`Failed to set balance: error ${result}`);
	}
}

/**
 * Get nonce synchronously using FFI
 */
function getNonceSync(
	stateManager: StateManager,
	address: AddressType,
): bigint {
	const sm = stateManager as any;
	const addressHex = Address.toHex(address);
	const outBuffer = new BigUint64Array(1);

	const result = sm.ffi.state_manager_get_nonce_sync(
		sm.handle,
		encodeCString(addressHex) as unknown as string,
		outBuffer,
	);

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
function setNonceSync(
	stateManager: StateManager,
	address: AddressType,
	nonce: bigint,
): void {
	const sm = stateManager as any;
	const addressHex = Address.toHex(address);

	const result = sm.ffi.state_manager_set_nonce(
		sm.handle,
		encodeCString(addressHex) as unknown as string,
		nonce,
	);

	if (result !== 0) {
		throw new Error(`Failed to set nonce: error ${result}`);
	}
}

/**
 * Get storage synchronously using FFI
 */
function getStorageSync(
	stateManager: StateManager,
	address: AddressType,
	slot: bigint,
): bigint {
	const sm = stateManager as any;
	const addressHex = Address.toHex(address);
	const slotHex = `0x${slot.toString(16).padStart(64, "0")}` as Hex;
	const buffer = new Uint8Array(67);

	const result = sm.ffi.state_manager_get_storage_sync(
		sm.handle,
		encodeCString(addressHex) as unknown as string,
		encodeCString(slotHex) as unknown as string,
		buffer,
		buffer.length,
	);

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
function setStorageSync(
	stateManager: StateManager,
	address: AddressType,
	slot: bigint,
	value: bigint,
): void {
	const sm = stateManager as any;
	const addressHex = Address.toHex(address);
	const slotHex = `0x${slot.toString(16).padStart(64, "0")}` as Hex;
	const valueHex = `0x${value.toString(16).padStart(64, "0")}` as Hex;

	const result = sm.ffi.state_manager_set_storage(
		sm.handle,
		encodeCString(addressHex) as unknown as string,
		encodeCString(slotHex) as unknown as string,
		encodeCString(valueHex) as unknown as string,
	);

	if (result !== 0) {
		throw new Error(`Failed to set storage: error ${result}`);
	}
}

/**
 * Get code synchronously using FFI
 */
function getCodeSync(
	stateManager: StateManager,
	address: AddressType,
): Uint8Array {
	const sm = stateManager as any;
	const addressHex = Address.toHex(address);

	// Get code length first
	const lenBuffer = new BigUint64Array(1);
	const lenResult = sm.ffi.state_manager_get_code_len_sync(
		sm.handle,
		encodeCString(addressHex) as unknown as string,
		lenBuffer,
	);

	if (lenResult !== 0) {
		throw new Error(`Failed to get code length: error ${lenResult}`);
	}

	const codeLen = Number(lenBuffer[0]);
	if (codeLen === 0) {
		return new Uint8Array(0);
	}

	// Get code bytes
	const codeBuffer = new Uint8Array(codeLen);
	const codeResult = sm.ffi.state_manager_get_code_sync(
		sm.handle,
		encodeCString(addressHex) as unknown as string,
		codeBuffer,
		codeLen,
	);

	if (codeResult !== 0) {
		throw new Error(`Failed to get code: error ${codeResult}`);
	}

	return codeBuffer;
}

/**
 * Set code synchronously using FFI
 */
function setCodeSync(
	stateManager: StateManager,
	address: AddressType,
	code: Uint8Array,
): void {
	const sm = stateManager as any;
	const addressHex = Address.toHex(address);

	const result = sm.ffi.state_manager_set_code(
		sm.handle,
		encodeCString(addressHex) as unknown as string,
		code,
		code.length,
	);

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
function addressToKey(address: AddressType): string {
	return HexUtils.fromBytes(address as unknown as Uint8Array).toLowerCase();
}
