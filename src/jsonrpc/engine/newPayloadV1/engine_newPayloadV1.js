/**
 * @fileoverview engine_newPayloadV1 JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
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
