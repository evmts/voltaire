/**
 * Transaction EIP-1559 Constructor type
 *
 * @typedef {object} TransactionEIP1559Prototype
 * @property {readonly "TransactionEIP1559"} __tag
 * @property {import('../types.js').Type.EIP1559} type
 * @property {bigint} chainId
 * @property {bigint} nonce
 * @property {bigint} maxPriorityFeePerGas
 * @property {bigint} maxFeePerGas
 * @property {bigint} gasLimit
 * @property {import('../../Address/index.js').BrandedAddress | null} to
 * @property {bigint} value
 * @property {Uint8Array} data
 * @property {import('../types.js').AccessList} accessList
 * @property {number} yParity
 * @property {Uint8Array} r
 * @property {Uint8Array} s
 * @property {() => Uint8Array} serialize
 * @property {() => import('../../Hash/index.js').BrandedHash} hash
 * @property {() => import('../../Hash/index.js').BrandedHash} getSigningHash
 * @property {() => import('../../Address/index.js').BrandedAddress} getSender
 * @property {() => boolean} verifySignature
 * @property {(baseFee: bigint) => bigint} getEffectiveGasPrice
 */

/**
 * @typedef {object} TransactionEIP1559Constructor
 * @property {(tx: {
 *   chainId: bigint;
 *   nonce: bigint;
 *   maxPriorityFeePerGas: bigint;
 *   maxFeePerGas: bigint;
 *   gasLimit: bigint;
 *   to: import('../../Address/index.js').BrandedAddress | null;
 *   value: bigint;
 *   data: Uint8Array;
 *   accessList: import('../types.js').AccessList;
 *   yParity: number;
 *   r: Uint8Array;
 *   s: Uint8Array;
 * }) => TransactionEIP1559Prototype} constructor
 * @property {TransactionEIP1559Prototype} prototype
 * @property {(bytes: Uint8Array) => TransactionEIP1559Prototype} deserialize
 * @property {(tx: import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559) => Uint8Array} serialize
 * @property {(tx: import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559) => import('../../Hash/index.js').BrandedHash} hash
 * @property {(tx: import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559) => import('../../Hash/index.js').BrandedHash} getSigningHash
 * @property {(tx: import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559) => import('../../Address/index.js').BrandedAddress} getSender
 * @property {(tx: import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559) => boolean} verifySignature
 * @property {(tx: import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559, baseFee: bigint) => bigint} getEffectiveGasPrice
 */

export {};
