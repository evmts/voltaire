/**
 * @fileoverview engine_newPayloadV5 JSON-RPC method
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
 * Parent beacon block root: "0x169630f535b4a41330164c6e5c92b1224c0c407f582d407d0ac3d206cd32fd52"
 * Execution requests: ...
 * Result: ...
 *
 * Implements the `engine_newPayloadV5` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_newPayloadV5";
/**
 * Result for `engine_newPayloadV5`
 *
 * Payload status object deprecating INVALID_BLOCK_HASH status
 *
 * @typedef {Quantity} Result
 */
