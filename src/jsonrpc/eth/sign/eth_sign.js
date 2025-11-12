/**
 * @fileoverview eth_sign JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns an EIP-191 signature over the provided data.
 *
 * @example
 * Address: "0x9b2055d370f73ec7d8a03e965129118dc8f5bf83"
 * Message: "0xdeadbeaf"
 * Result: "0xa3f20717a250c2b0b729b7e5becbff67fdaef7e0699da4de7ca5895b02a170a12d887fd3b17bfdce3481f10bea41f45ba9f709d39ce8325427b57afcfc994cee1b"
 *
 * Implements the `eth_sign` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_sign";
/**
 * Result for `eth_sign`
 *
 * 65 hex encoded bytes
 *
 * @typedef {Quantity} Result
 */
