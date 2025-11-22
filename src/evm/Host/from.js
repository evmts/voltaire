/**
 * Create a Host interface implementation
 *
 * @param {object} impl - Host implementation
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType): bigint} impl.getBalance - Get balance
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, bigint): void} impl.setBalance - Set balance
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType): Uint8Array} impl.getCode - Get code
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, Uint8Array): void} impl.setCode - Set code
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, bigint): bigint} impl.getStorage - Get storage
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, bigint, bigint): void} impl.setStorage - Set storage
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType): bigint} impl.getNonce - Get nonce
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, bigint): void} impl.setNonce - Set nonce
 * @returns {import("./HostType.js").HostType} Host instance
 */
export function from(impl) {
	return /** @type {import("./HostType.js").HostType} */ (impl);
}
