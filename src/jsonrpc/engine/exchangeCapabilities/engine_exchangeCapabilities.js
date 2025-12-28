/**
 * @fileoverview engine_exchangeCapabilities JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
 */

/**
 * Exchanges list of supported Engine API methods
 *
 * @example
 * Consensus client methods: ...
 * Result: ...
 *
 * Implements the `engine_exchangeCapabilities` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_exchangeCapabilities";
/**
 * Result for `engine_exchangeCapabilities`
 *
 * @typedef {Quantity} Result
 */
