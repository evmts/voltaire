/**
 * @fileoverview engine_forkchoiceUpdatedV3 JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
 */

/**
 * Updates the forkchoice state
 *
 * @example
 * Forkchoice state: ...
 * Payload attributes: ...
 * Result: ...
 *
 * Implements the `engine_forkchoiceUpdatedV3` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_forkchoiceUpdatedV3";
/**
 * Result for `engine_forkchoiceUpdatedV3`
 *
 * Forkchoice updated response
 *
 * @typedef {Quantity} Result
 */
