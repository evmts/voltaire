/**
 * EIP-7702 Transaction (Type 4) Factory
 *
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { TransactionEIP7702 } from './TransactionEIP7702.js';
 *
 * // Factory function
 * const tx = TransactionEIP7702({ chainId: 1n, nonce: 0n, ... });
 *
 * // Static methods
 * const hash = TransactionEIP7702.hash(tx);
 * const sender = TransactionEIP7702.getSender(tx);
 * const price = TransactionEIP7702.getEffectiveGasPrice(tx, baseFee);
 *
 * // Instance methods
 * const hash2 = tx.hash();
 * const sender2 = tx.getSender();
 * const price2 = tx.getEffectiveGasPrice(baseFee);
 * ```
 */

// Import types
import type { TransactionEIP7702Constructor } from "./TransactionEIP7702Constructor.js";

// Import all method functions
import { Type } from "../types.js";
import { deserialize } from "./deserialize.js";
import { getEffectiveGasPrice } from "./getEffectiveGasPrice.js";
import { getSender } from "./getSender.js";
import { getSigningHash } from "./getSigningHash.js";
import { hash } from "./hash.js";
import { serialize } from "./serialize.js";
import { verifySignature } from "./verifySignature.js";

// Re-export types
export * from "./BrandedTransactionEIP7702.js";

// Re-export method functions for tree-shaking
export {
	deserialize,
	getEffectiveGasPrice,
	getSender,
	getSigningHash,
	hash,
	serialize,
	verifySignature,
};

/**
 * Factory function for creating EIP-7702 Transaction instances
 */
export const TransactionEIP7702 = ((tx) => {
	return {
		__tag: "TransactionEIP7702",
		type: Type.EIP7702,
		chainId: tx.chainId,
		nonce: tx.nonce,
		maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
		maxFeePerGas: tx.maxFeePerGas,
		gasLimit: tx.gasLimit,
		to: tx.to,
		value: tx.value,
		data: tx.data,
		accessList: tx.accessList,
		authorizationList: tx.authorizationList,
		yParity: tx.yParity,
		r: tx.r,
		s: tx.s,
	};
}) as TransactionEIP7702Constructor;

// Initialize prototype
TransactionEIP7702.prototype = {} as any;

// Attach static methods
TransactionEIP7702.deserialize = deserialize;
TransactionEIP7702.serialize = serialize;
TransactionEIP7702.hash = hash;
TransactionEIP7702.getSigningHash = getSigningHash;
TransactionEIP7702.getSender = getSender;
TransactionEIP7702.verifySignature = verifySignature;
TransactionEIP7702.getEffectiveGasPrice = getEffectiveGasPrice;

// Bind prototype methods using Function.prototype.call.bind
TransactionEIP7702.prototype.serialize = Function.prototype.call.bind(serialize) as any;
TransactionEIP7702.prototype.hash = Function.prototype.call.bind(hash) as any;
TransactionEIP7702.prototype.getSigningHash = Function.prototype.call.bind(getSigningHash) as any;
TransactionEIP7702.prototype.getSender = Function.prototype.call.bind(getSender) as any;
TransactionEIP7702.prototype.verifySignature = Function.prototype.call.bind(verifySignature) as any;
TransactionEIP7702.prototype.getEffectiveGasPrice = Function.prototype.call.bind(getEffectiveGasPrice) as any;
