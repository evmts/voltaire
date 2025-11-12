/**
 * Create a Host interface implementation
 *
 * @param {object} impl - Host implementation
 * @param {function(import("../../primitives/Address/BrandedAddress.js").Address): bigint} impl.getBalance - Get balance
 * @param {function(import("../../primitives/Address/BrandedAddress.js").Address, bigint): void} impl.setBalance - Set balance
 * @param {function(import("../../primitives/Address/BrandedAddress.js").Address): Uint8Array} impl.getCode - Get code
 * @param {function(import("../../primitives/Address/BrandedAddress.js").Address, Uint8Array): void} impl.setCode - Set code
 * @param {function(import("../../primitives/Address/BrandedAddress.js").Address, bigint): bigint} impl.getStorage - Get storage
 * @param {function(import("../../primitives/Address/BrandedAddress.js").Address, bigint, bigint): void} impl.setStorage - Set storage
 * @param {function(import("../../primitives/Address/BrandedAddress.js").Address): bigint} impl.getNonce - Get nonce
 * @param {function(import("../../primitives/Address/BrandedAddress.js").Address, bigint): void} impl.setNonce - Set nonce
 * @returns {import("./BrandedHost.js").BrandedHost} Host instance
 */
export function from(impl) {
	return /** @type {import("./BrandedHost.js").BrandedHost} */ (impl);
}
