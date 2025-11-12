/**
 * @fileoverview eth_getBlockByHash JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns information about a block by hash.
 *
 * @example
 * Block hash: "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c"
 * Hydrated transactions: false
 * Result: ...
 *
 * Implements the `eth_getBlockByHash` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockByHash";
/**
 * Result for `eth_getBlockByHash`
 *
 * @typedef {Quantity} Result
 */
