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
export const method = 'eth_feeHistory'

/**
 * Parameters for `eth_feeHistory`
 *
 * @typedef {Object} Params
 * @property {Quantity} blockcount - hex encoded unsigned integer
 * @property {Quantity} newestblock - Block number or tag
 * @property {Quantity} rewardpercentiles - rewardPercentiles
 */

export {}
/**
 * Result for `eth_feeHistory`
 *
 * feeHistoryResults
 *
 * @typedef {Quantity} Result
 */
