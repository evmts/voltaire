/**
 * @fileoverview engine_newPayloadV3 JSON-RPC method
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
 * Expected blob versioned hashes: ...
 * Root of the parent beacon block: "0x169630f535b4a41330164c6e5c92b1224c0c407f582d407d0ac3d206cd32fd52"
 * Result: ...
 *
 * Implements the `engine_newPayloadV3` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_newPayloadV3";

/**
 * Parameters for `engine_newPayloadV3`
 *
 * @typedef {Object} Params
 * @property {Quantity} execution payload - Execution payload object V3
 * @property {Quantity} expected blob versioned hashes
 * @property {Hash} root of the parent beacon block - 32 byte hex value
 */

export {};
/**
 * Result for `engine_newPayloadV3`
 *
 * Payload status object deprecating INVALID_BLOCK_HASH status
 *
 * @typedef {Quantity} Result
 */
