import { HDWalletError } from "./errors.js";

/**
 * Get Ethereum address from HD node
 *
 * @param {import('./types.js').HDNode} node - HD node
 * @returns {Promise<import('../../primitives/Address/AddressType.js').AddressType>} Ethereum address
 * @throws {HDWalletError} If address derivation fails
 */
export async function getAddress(node) {
	const { getLibwally } = await import("./ffi.js");
	const libwally = await getLibwally();

	const address = new Uint8Array(20);
	const result = libwally.hdwallet_get_address(node.handle, address);

	if (result !== 0) {
		throw new HDWalletError("Failed to get address", {
			code: -32000,
			context: { result },
			docsPath: "/crypto/hdwallet/get-address#error-handling",
		});
	}

	return /** @type {import('../../primitives/Address/AddressType.js').AddressType} */ (
		new Uint8Array(address)
	);
}
