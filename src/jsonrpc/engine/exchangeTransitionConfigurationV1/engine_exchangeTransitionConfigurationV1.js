/**
 * @fileoverview engine_exchangeTransitionConfigurationV1 JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
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
