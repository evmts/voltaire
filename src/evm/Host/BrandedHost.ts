import type { Address } from "../../primitives/Address/BrandedAddress.js";

/**
 * BrandedHost - EVM host interface for external state access
 *
 * Provides access to account state (balances, storage, code, nonces).
 * Based on guillotine-mini HostInterface vtable pattern.
 */
export type BrandedHost = {
	readonly __tag: "Host";

	/**
	 * Get account balance
	 */
	getBalance: (address: Address) => bigint;

	/**
	 * Set account balance
	 */
	setBalance: (address: Address, balance: bigint) => void;

	/**
	 * Get account code
	 */
	getCode: (address: Address) => Uint8Array;

	/**
	 * Set account code
	 */
	setCode: (address: Address, code: Uint8Array) => void;

	/**
	 * Get storage slot value
	 */
	getStorage: (address: Address, slot: bigint) => bigint;

	/**
	 * Set storage slot value
	 */
	setStorage: (address: Address, slot: bigint, value: bigint) => void;

	/**
	 * Get account nonce
	 */
	getNonce: (address: Address) => bigint;

	/**
	 * Set account nonce
	 */
	setNonce: (address: Address, nonce: bigint) => void;
};
