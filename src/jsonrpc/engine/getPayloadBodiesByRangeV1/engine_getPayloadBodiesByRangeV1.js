/**
 * @fileoverview engine_getPayloadBodiesByRangeV1 JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Given a range of block numbers returns bodies of the corresponding execution payloads
 *
 * @example
 * Starting block number: "0x20"
 * Number of blocks to return: "0x2"
 * Result: ...
 *
 * Implements the `engine_getPayloadBodiesByRangeV1` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_getPayloadBodiesByRangeV1";
/**
 * Result for `engine_getPayloadBodiesByRangeV1`
 *
 * @typedef {Quantity} Result
 */
