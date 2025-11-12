/**
 * @fileoverview engine_forkchoiceUpdatedV1 JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Updates the forkchoice state
 *
 * @example
 * Forkchoice state: ...
 * Payload attributes: ...
 * Result: ...
 *
 * Implements the `engine_forkchoiceUpdatedV1` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_forkchoiceUpdatedV1";
/**
 * Result for `engine_forkchoiceUpdatedV1`
 *
 * Forkchoice updated response
 *
 * @typedef {Quantity} Result
 */
