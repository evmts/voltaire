/**
 * EIP-4844 Transaction (Type 3) Factory
 *
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { TransactionEIP4844 } from './TransactionEIP4844.js';
 *
 * // Factory function
 * const tx = TransactionEIP4844({ chainId: 1n, nonce: 0n, ... });
 *
 * // Static methods
 * const hash = TransactionEIP4844.hash(tx);
 * const sender = TransactionEIP4844.getSender(tx);
 * const cost = TransactionEIP4844.getBlobGasCost(tx, blobBaseFee);
 *
 * // Instance methods
 * const hash2 = tx.hash();
 * const sender2 = tx.getSender();
 * const cost2 = tx.getBlobGasCost(blobBaseFee);
 * ```
 */

// Import all method functions
import { Type } from "../types.js";
import { deserialize } from "./deserialize.js";
import { getBlobGasCost } from "./getBlobGasCost.js";
import { getEffectiveGasPrice } from "./getEffectiveGasPrice.js";
import { getSender } from "./getSender.js";
import { getSigningHash } from "./getSigningHash.js";
import { hash } from "./hash.js";
import { serialize } from "./serialize.js";
import { verifySignature } from "./verifySignature.js";

// Re-export types
export * from "./BrandedTransactionEIP4844.js";

// Re-export method functions for tree-shaking
export {
	deserialize,
	getBlobGasCost,
	getEffectiveGasPrice,
	getSender,
	getSigningHash,
	hash,
	serialize,
	verifySignature,
};

/**
 * @typedef {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} BrandedTransactionEIP4844
 * @typedef {import('./TransactionEIP4844Constructor.js').TransactionEIP4844Constructor} TransactionEIP4844Constructor
 */

/**
 * Factory function for creating EIP-4844 Transaction instances
 *
 * @type {TransactionEIP4844Constructor}
 */
export function TransactionEIP4844(tx) {
	return {
		__tag: "TransactionEIP4844",
		type: Type.EIP4844,
		chainId: tx.chainId,
		nonce: tx.nonce,
		maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
		maxFeePerGas: tx.maxFeePerGas,
		gasLimit: tx.gasLimit,
		to: tx.to,
		value: tx.value,
		data: tx.data,
		accessList: tx.accessList,
		maxFeePerBlobGas: tx.maxFeePerBlobGas,
		blobVersionedHashes: tx.blobVersionedHashes,
		yParity: tx.yParity,
		r: tx.r,
		s: tx.s,
	};
}

// Attach static methods
TransactionEIP4844.deserialize = deserialize;
TransactionEIP4844.serialize = serialize;
TransactionEIP4844.hash = hash;
TransactionEIP4844.getSigningHash = getSigningHash;
TransactionEIP4844.getSender = getSender;
TransactionEIP4844.verifySignature = verifySignature;
TransactionEIP4844.getEffectiveGasPrice = getEffectiveGasPrice;
TransactionEIP4844.getBlobGasCost = getBlobGasCost;

// Bind prototype methods using Function.prototype.call.bind
TransactionEIP4844.prototype.serialize = Function.prototype.call.bind(serialize);
TransactionEIP4844.prototype.hash = Function.prototype.call.bind(hash);
TransactionEIP4844.prototype.getSigningHash =
	Function.prototype.call.bind(getSigningHash);
TransactionEIP4844.prototype.getSender = Function.prototype.call.bind(getSender);
TransactionEIP4844.prototype.verifySignature =
	Function.prototype.call.bind(verifySignature);
TransactionEIP4844.prototype.getEffectiveGasPrice =
	Function.prototype.call.bind(getEffectiveGasPrice);
TransactionEIP4844.prototype.getBlobGasCost =
	Function.prototype.call.bind(getBlobGasCost);
