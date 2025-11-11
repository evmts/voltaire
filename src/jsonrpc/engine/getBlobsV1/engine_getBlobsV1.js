/**
 * @fileoverview engine_getBlobsV1 JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Fetches blobs from the blob pool
 *
 * @example
 * Blob versioned hashes: ...
 * Result: ...
 *
 * Implements the `engine_getBlobsV1` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = 'engine_getBlobsV1'

/**
 * Parameters for `engine_getBlobsV1`
 *
 * @typedef {Object} Params
 * @property {Quantity} blob versioned hashes
 */

export {}
/**
 * Result for `engine_getBlobsV1`
 *
 * @typedef {Quantity} Result
 */
