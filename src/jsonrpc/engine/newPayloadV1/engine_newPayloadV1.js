/**
 * @fileoverview engine_newPayloadV1 JSON-RPC method
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
 * Implements the `engine_newPayloadV1` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_newPayloadV1";
/**
 * Result for `engine_newPayloadV1`
 *
 * Payload status object V1
 *
 * @typedef {Quantity} Result
 */
