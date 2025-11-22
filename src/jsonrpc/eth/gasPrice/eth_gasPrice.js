/**
 * @fileoverview eth_gasPrice JSON-RPC method
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
 * Returns the current price per gas in wei.
 *
 * @example
 * Result: "0x3e8"
 *
 * Implements the `eth_gasPrice` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_gasPrice";
/**
 * Result for `eth_gasPrice`
 *
 * Gas price
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_gasPrice JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function GasPriceRequest() {
	return { method };
}
