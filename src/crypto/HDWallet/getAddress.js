import { HDWalletError } from "./errors.js";

/**
 * Get Ethereum address from HD node
 *
 * @param {import('./types.js').HDNode} node - HD node
 * @returns {Promise<import('../../primitives/Address/BrandedAddress/BrandedAddress.js').BrandedAddress>} Ethereum address
 * @throws {HDWalletError} If address derivation fails
 */
export async function getAddress(node) {
	const { libwally } = await import("./ffi.js");

	const address = Buffer.alloc(20);
	const result = libwally.hdwallet_get_address(node.handle, address);

	if (result !== 0) {
		throw new HDWalletError("Failed to get address", {
			code: "ADDRESS_DERIVATION_FAILED",
			context: { result },
			docsPath: "/crypto/hdwallet/get-address#error-handling",
		});
	}

	return /** @type {import('../../primitives/Address/BrandedAddress/BrandedAddress.js').BrandedAddress} */ (
		new Uint8Array(address)
	);
}
