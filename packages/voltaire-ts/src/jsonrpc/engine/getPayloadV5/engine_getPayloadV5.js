/**
 * @fileoverview engine_getPayloadV5 JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
 */

/**
 * Obtains execution payload from payload build process
 *
 * @example
 * Payload id: "0x0000000038fa5dd"
 * Result: ...
 *
 * Implements the `engine_getPayloadV5` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "engine_getPayloadV5";
/**
 * Result for `engine_getPayloadV5`
 *
 * @typedef {Quantity} Result
 */
