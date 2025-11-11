/**
 * @fileoverview debug_getRawTransaction JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns an array of EIP-2718 binary-encoded transactions.
 *
 * @example
 * Transaction hash: "0x3a2fd1a5ea9ffee477f449be53a49398533d2c006a5815023920d1c397298df3"
 * Result: "0xf8678084342770c182520894658bdf435d810c91414ec09147daa6db624063798203e880820a95a0af5fc351b9e457a31f37c84e5cd99dd3c5de60af3de33c6f4160177a2c786a60a0201da7a21046af55837330a2c52fc1543cd4d9ead00ddf178dd96935b607ff9b"
 *
 * Implements the `debug_getRawTransaction` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "debug_getRawTransaction";

/**
 * Parameters for `debug_getRawTransaction`
 *
 * @typedef {Object} Params
 * @property {Hash} transaction hash - 32 byte hex value
 */

export {};
/**
 * Result for `debug_getRawTransaction`
 *
 * hex encoded bytes
 *
 * @typedef {Quantity} Result
 */
