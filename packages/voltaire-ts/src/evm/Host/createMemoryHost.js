import * as Hex from "../../primitives/Hex/index.js";
import { from } from "./from.js";

/**
 * Read a slot value from a nested address->slot map
 * @param {Map<string, Map<string, bigint>>} store
 * @param {string} addrKey
 * @param {bigint} slot
 * @returns {bigint}
 */
function readSlot(store, addrKey, slot) {
	return store.get(addrKey)?.get(slot.toString(16)) ?? 0n;
}

/**
 * Write a slot value into a nested address->slot map
 * @param {Map<string, Map<string, bigint>>} store
 * @param {string} addrKey
 * @param {bigint} slot
 * @param {bigint} value
 */
function writeSlot(store, addrKey, slot, value) {
	let addrStorage = store.get(addrKey);
	if (!addrStorage) {
		addrStorage = new Map();
		store.set(addrKey, addrStorage);
	}
	addrStorage.set(slot.toString(16), value);
}

/**
 * Create an in-memory Host implementation for testing
 *
 * @returns {import("./HostType.js").BrandedHost} Memory-backed Host
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

	/** @param {Uint8Array} address */
	const toKey = (address) => Hex.fromBytes(address).slice(2);

	return from({
		getBalance: (address) => balances.get(toKey(address)) ?? 0n,
		setBalance: (address, balance) => {
			balances.set(toKey(address), balance);
		},
		getCode: (address) => codes.get(toKey(address)) ?? new Uint8Array(0),
		setCode: (address, code) => {
			codes.set(toKey(address), code);
		},
		getStorage: (address, slot) => readSlot(storage, toKey(address), slot),
		setStorage: (address, slot, value) => {
			writeSlot(storage, toKey(address), slot, value);
		},
		getNonce: (address) => nonces.get(toKey(address)) ?? 0n,
		setNonce: (address, nonce) => {
			nonces.set(toKey(address), nonce);
		},
		/** @param {Uint8Array} address @param {bigint} slot */
		getTransientStorage: (address, slot) =>
			readSlot(transientStorage, toKey(address), slot),
		/** @param {Uint8Array} address @param {bigint} slot @param {bigint} value */
		setTransientStorage: (address, slot, value) => {
			writeSlot(transientStorage, toKey(address), slot, value);
		},
	});
}
