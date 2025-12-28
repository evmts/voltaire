/**
 * @fileoverview engine_exchangeTransitionConfigurationV1 JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
 */

/**
 * Exchanges transition configuration
 *
 * @example
 * Consensus client configuration: ...
 * Result: ...
 *
 * Implements the `engine_exchangeTransitionConfigurationV1` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_exchangeTransitionConfigurationV1";
/**
 * Result for `engine_exchangeTransitionConfigurationV1`
 *
 * Transition configuration object
 *
 * @typedef {Quantity} Result
 */
