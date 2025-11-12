/**
 * Branded EIP-1559 Transaction type
 *
 * @typedef {object} BrandedTransactionEIP1559
 * @property {import('../types.js').Type.EIP1559} type - Transaction type (0x02)
 * @property {bigint} chainId - Chain ID
 * @property {bigint} nonce - Transaction nonce
 * @property {bigint} maxPriorityFeePerGas - Max priority fee per gas
 * @property {bigint} maxFeePerGas - Max fee per gas
 * @property {bigint} gasLimit - Gas limit
 * @property {import('../../Address/index.js').BrandedAddress | null} to - Recipient address (null for contract creation)
 * @property {bigint} value - Value in wei
 * @property {Uint8Array} data - Transaction data
 * @property {import('../types.js').AccessList} accessList - Access list
 * @property {number} yParity - Signature y parity (0 or 1)
 * @property {Uint8Array} r - Signature r value
 * @property {Uint8Array} s - Signature s value
 */

export {};
