/**
 * @fileoverview engine_newPayloadV4 JSON-RPC method
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
 * Expected blob versioned hashes: ...
 * Root of the parent beacon block: "0x169630f535b4a41330164c6e5c92b1224c0c407f582d407d0ac3d206cd32fd52"
 * Execution requests: ...
 * Result: ...
 *
 * Implements the `engine_newPayloadV4` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_newPayloadV4";
/**
 * Result for `engine_newPayloadV4`
 *
 * Payload status object deprecating INVALID_BLOCK_HASH status
 *
 * @typedef {Quantity} Result
 */
