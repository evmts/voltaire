/**
 * @fileoverview eth_feeHistory JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Transaction fee history
 *
 * @example
 * blockCount: "0x5"
 * newestblock: "latest"
 * rewardPercentiles: ...
 * Result: ...
 *
 * Implements the `eth_feeHistory` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_feeHistory";
/**
 * Result for `eth_feeHistory`
 *
 * feeHistoryResults
 *
 * @typedef {Quantity} Result
 */
