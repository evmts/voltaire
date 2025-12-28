/**
 * @fileoverview eth_getTransactionReceipt JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the receipt of a transaction by transaction hash.
 *
 * @example
 * Transaction hash: "0x504ce587a65bdbdb6414a0c6c16d86a04dd79bfcc4f2950eec9634b30ce5370f"
 * Result: ...
 *
 * Implements the `eth_getTransactionReceipt` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getTransactionReceipt";
/**
 * Result for `eth_getTransactionReceipt`
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_getTransactionReceipt JSON-RPC request
 *
 * @param {Hash} address
 * @returns {RequestArguments}
 */
export function GetTransactionReceiptRequest(address) {
	return { method, params: [address] };
}
