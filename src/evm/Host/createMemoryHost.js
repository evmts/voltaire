import { from } from "./from.js";

/**
 * Create an in-memory Host implementation for testing
 *
 * @returns {import("./BrandedHost.js").BrandedHost} Memory-backed Host
 */
export function createMemoryHost() {
	/** @type {Map<string, bigint>} */
	const balances = new Map();

	/** @type {Map<string, Uint8Array>} */
	const codes = new Map();

	/** @type {Map<string, Map<string, bigint>>} */
	const storage = new Map();

	/** @type {Map<string, Map<string, bigint>>} */
	const transientStorage = new Map();

	/** @type {Map<string, bigint>} */
	const nonces = new Map();

	/**
	 * Get storage key
	 * @param {import("../../primitives/Address/BrandedAddress.js").Address} address - Address
	 * @param {bigint} slot - Slot
	 * @returns {string} Storage key
	 */
	const getStorageKey = (address, slot) =>
		`${Buffer.from(address).toString("hex")}-${slot.toString(16)}`;

	return from({
		getBalance: (address) => {
			const key = Buffer.from(address).toString("hex");
			return balances.get(key) ?? 0n;
		},

		setBalance: (address, balance) => {
			const key = Buffer.from(address).toString("hex");
			balances.set(key, balance);
		},

		getCode: (address) => {
			const key = Buffer.from(address).toString("hex");
			return codes.get(key) ?? new Uint8Array(0);
		},

		setCode: (address, code) => {
			const key = Buffer.from(address).toString("hex");
			codes.set(key, code);
		},

		getStorage: (address, slot) => {
			const addrKey = Buffer.from(address).toString("hex");
			const addrStorage = storage.get(addrKey);
			if (!addrStorage) return 0n;
			return addrStorage.get(slot.toString(16)) ?? 0n;
		},

		setStorage: (address, slot, value) => {
			const addrKey = Buffer.from(address).toString("hex");
			let addrStorage = storage.get(addrKey);
			if (!addrStorage) {
				addrStorage = new Map();
				storage.set(addrKey, addrStorage);
			}
			addrStorage.set(slot.toString(16), value);
		},

		getNonce: (address) => {
			const key = Buffer.from(address).toString("hex");
			return nonces.get(key) ?? 0n;
		},

		setNonce: (address, nonce) => {
			const key = Buffer.from(address).toString("hex");
			nonces.set(key, nonce);
		},

		getTransientStorage: (address, slot) => {
			const addrKey = Buffer.from(address).toString("hex");
			const addrStorage = transientStorage.get(addrKey);
			if (!addrStorage) return 0n;
			return addrStorage.get(slot.toString(16)) ?? 0n;
		},

		setTransientStorage: (address, slot, value) => {
			const addrKey = Buffer.from(address).toString("hex");
			let addrStorage = transientStorage.get(addrKey);
			if (!addrStorage) {
				addrStorage = new Map();
				transientStorage.set(addrKey, addrStorage);
			}
			addrStorage.set(slot.toString(16), value);
		},
	});
}
