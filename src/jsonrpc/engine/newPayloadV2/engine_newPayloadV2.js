/**
 * @fileoverview engine_newPayloadV2 JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Runs execution payload validation
 *
 * @example
 * Execution payload: ...
 * Result: ...
 *
 * Implements the `engine_newPayloadV2` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_newPayloadV2";

/**
 * Parameters for `engine_newPayloadV2`
 *
 * @typedef {Object} Params
 * @property {Quantity} execution payload
 */

export {};
/**
 * Result for `engine_newPayloadV2`
 *
 * Payload status object deprecating INVALID_BLOCK_HASH status
 *
 * @typedef {Quantity} Result
 */
