/**
 * @fileoverview engine_getBlobsV2 JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
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
