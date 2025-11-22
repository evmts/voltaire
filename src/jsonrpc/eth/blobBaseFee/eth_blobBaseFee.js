/**
 * @fileoverview eth_blobBaseFee JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the base fee per blob gas in wei.
 *
 * @example
 * Result: "0x3f5694c1f"
 *
 * Implements the `eth_blobBaseFee` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_blobBaseFee";
/**
 * Result for `eth_blobBaseFee`
 *
 * Blob gas base fee
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_blobBaseFee JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function BlobBaseFeeRequest() {
	return { method };
}
