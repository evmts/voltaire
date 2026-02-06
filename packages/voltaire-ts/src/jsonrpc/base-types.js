/**
 * @fileoverview Base JSON-RPC primitive types from Ethereum execution API spec
 * These types correspond to the base-types.yaml schema in the execution-apis spec
 */

/**
 * Hex encoded unsigned integer (Quantity in execution-apis)
 * Pattern: ^0x(0|[1-9a-f][0-9a-f]*)$
 * @typedef {string} Quantity
 */
export const Quantity = undefined;

/**
 * 32 byte hex value (hash32 in execution-apis)
 * Pattern: ^0x[0-9a-f]{64}$
 * @typedef {string} Hash
 */
export const Hash = undefined;

/**
 * Block tag enum values
 * @typedef {'earliest' | 'finalized' | 'safe' | 'latest' | 'pending'} BlockTag
 */
export const BlockTag = undefined;

/**
 * Block specifier - either a block number (Quantity) or block tag
 * Corresponds to BlockNumberOrTag in execution-apis
 * @typedef {Quantity | BlockTag} BlockSpec
 */
export const BlockSpec = undefined;

/**
 * Hex encoded bytes (Data in execution-apis)
 * Pattern: ^0x[0-9a-f]*$
 * @typedef {string} Data
 */
export const Data = undefined;

/**
 * Block object (simplified for JSON-RPC types)
 * @typedef {object} Block
 * @property {Hash} hash - Block hash
 * @property {Hash} parentHash - Parent block hash
 * @property {Quantity} number - Block number
 * @property {Quantity} timestamp - Block timestamp
 * @property {Quantity} nonce - Block nonce
 * @property {Quantity} difficulty - Block difficulty
 * @property {Quantity} gasLimit - Gas limit
 * @property {Quantity} gasUsed - Gas used
 * @property {Data} miner - Miner address
 * @property {Data} extraData - Extra data
 * @property {Hash[]} transactions - Transaction hashes or objects
 * @property {Hash[]} uncles - Uncle hashes
 */
export const Block = undefined;
