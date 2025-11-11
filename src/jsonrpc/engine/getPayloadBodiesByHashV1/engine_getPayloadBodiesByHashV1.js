/**
 * @fileoverview engine_getPayloadBodiesByHashV1 JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Given block hashes returns bodies of the corresponding execution payloads
 *
 * @example
 * Array of block hashes: ...
 * Result: ...
 *
 * Implements the `engine_getPayloadBodiesByHashV1` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_getPayloadBodiesByHashV1";

/**
 * Parameters for `engine_getPayloadBodiesByHashV1`
 *
 * @typedef {Object} Params
 * @property {Quantity} array of block hashes
 */

export {};
/**
 * Result for `engine_getPayloadBodiesByHashV1`
 *
 * @typedef {Quantity} Result
 */
