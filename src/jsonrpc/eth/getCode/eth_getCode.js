/**
 * @fileoverview eth_getCode JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns code at a given address.
 *
 * @example
 * Address: "0xa50a51c09a5c451c52bb714527e1974b686d8e77"
 * Block: "latest"
 * Result: "0x60806040526004361060485763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416633fa4f2458114604d57806355241077146071575b600080fd5b348015605857600080fd5b50605f6088565b60408051918252519081900360200190f35b348015607c57600080fd5b506086600435608e565b005b60005481565b60008190556040805182815290517f199cd93e851e4c78c437891155e2112093f8f15394aa89dab09e38d6ca0727879181900360200190a1505600a165627a7a723058209d8929142720a69bde2ab3bfa2da6217674b984899b62753979743c0470a2ea70029"
 *
 * Implements the `eth_getCode` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getCode";
/**
 * Result for `eth_getCode`
 *
 * hex encoded bytes
 *
 * @typedef {Quantity} Result
 */
