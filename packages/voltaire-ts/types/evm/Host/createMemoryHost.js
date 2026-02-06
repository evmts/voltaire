import * as Hex from "../../primitives/Hex/index.js";
import { from } from "./from.js";
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
    /**
     * Get storage key
     * @param {import("../../primitives/Address/AddressType.js").AddressType} address - Address
     * @param {bigint} slot - Slot
     * @returns {string} Storage key
     */
    const _getStorageKey = (address, slot) => `${Hex.fromBytes(address).slice(2)}-${slot.toString(16)}`;
    return from({
        getBalance: (address) => {
            const key = Hex.fromBytes(address).slice(2);
            return balances.get(key) ?? 0n;
        },
        setBalance: (address, balance) => {
            const key = Hex.fromBytes(address).slice(2);
            balances.set(key, balance);
        },
        getCode: (address) => {
            const key = Hex.fromBytes(address).slice(2);
            return codes.get(key) ?? new Uint8Array(0);
        },
        setCode: (address, code) => {
            const key = Hex.fromBytes(address).slice(2);
            codes.set(key, code);
        },
        getStorage: (address, slot) => {
            const addrKey = Hex.fromBytes(address).slice(2);
            const addrStorage = storage.get(addrKey);
            if (!addrStorage)
                return 0n;
            return addrStorage.get(slot.toString(16)) ?? 0n;
        },
        setStorage: (address, slot, value) => {
            const addrKey = Hex.fromBytes(address).slice(2);
            let addrStorage = storage.get(addrKey);
            if (!addrStorage) {
                addrStorage = new Map();
                storage.set(addrKey, addrStorage);
            }
            addrStorage.set(slot.toString(16), value);
        },
        getNonce: (address) => {
            const key = Hex.fromBytes(address).slice(2);
            return nonces.get(key) ?? 0n;
        },
        setNonce: (address, nonce) => {
            const key = Hex.fromBytes(address).slice(2);
            nonces.set(key, nonce);
        },
        /** @param {Uint8Array} address @param {bigint} slot */
        getTransientStorage: (address, slot) => {
            const addrKey = Hex.fromBytes(address).slice(2);
            const addrStorage = transientStorage.get(addrKey);
            if (!addrStorage)
                return 0n;
            return addrStorage.get(slot.toString(16)) ?? 0n;
        },
        /** @param {Uint8Array} address @param {bigint} slot @param {bigint} value */
        setTransientStorage: (address, slot, value) => {
            const addrKey = Hex.fromBytes(address).slice(2);
            let addrStorage = transientStorage.get(addrKey);
            if (!addrStorage) {
                addrStorage = new Map();
                transientStorage.set(addrKey, addrStorage);
            }
            addrStorage.set(slot.toString(16), value);
        },
    });
}
