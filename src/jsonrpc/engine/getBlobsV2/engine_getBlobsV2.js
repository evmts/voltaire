/**
 * @fileoverview engine_getBlobsV2 JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
 */

/**
 * Fetch blobs from the blob mempool
 *
 * @example
 * Blob versioned hashes: ...
 * Result: ...
 *
 * Implements the `engine_getBlobsV2` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_getBlobsV2";
/**
 * Result for `engine_getBlobsV2`
 *
 * @typedef {Quantity} Result
 */
