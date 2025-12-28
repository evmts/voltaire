/**
 * @fileoverview engine_getPayloadBodiesByHashV1 JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
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
 * Result for `engine_getPayloadBodiesByHashV1`
 *
 * @typedef {Quantity} Result
 */
