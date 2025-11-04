/**
 * EIP-2930 Transaction (Type 1) Factory
 *
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { TransactionEIP2930 } from './TransactionEIP2930.js';
 *
 * // Factory function
 * const tx = TransactionEIP2930({ chainId: 1n, nonce: 0n, gasPrice: 20n, ... });
 *
 * // Static methods
 * const hash = TransactionEIP2930.hash(tx);
 * const sender = TransactionEIP2930.getSender(tx);
 *
 * // Instance methods
 * const hash2 = tx.hash();
 * const sender2 = tx.getSender();
 * ```
 */

// Import types
import type { TransactionEIP2930Constructor } from "./TransactionEIP2930Constructor.js";

// Import all method functions
import { Type } from "../types.js";
import { deserialize } from "./deserialize.js";
import { getSender } from "./getSender.js";
import { getSigningHash } from "./getSigningHash.js";
import { hash } from "./hash.js";
import { serialize } from "./serialize.js";
import { verifySignature } from "./verifySignature.js";

// Re-export types
export * from "./BrandedTransactionEIP2930.js";

// Re-export method functions for tree-shaking
export {
	deserialize,
	getSender,
	getSigningHash,
	hash,
	serialize,
	verifySignature,
};

/**
 * Factory function for creating EIP-2930 Transaction instances
 */
export const TransactionEIP2930 = ((tx) => {
	return {
		__tag: "TransactionEIP2930",
		type: Type.EIP2930,
		chainId: tx.chainId,
		nonce: tx.nonce,
		gasPrice: tx.gasPrice,
		gasLimit: tx.gasLimit,
		to: tx.to,
		value: tx.value,
		data: tx.data,
		accessList: tx.accessList,
		yParity: tx.yParity,
		r: tx.r,
		s: tx.s,
	};
}) as TransactionEIP2930Constructor;

// Initialize prototype
TransactionEIP2930.prototype = {} as any;

// Attach static methods
TransactionEIP2930.deserialize = deserialize;
TransactionEIP2930.serialize = serialize;
TransactionEIP2930.hash = hash;
TransactionEIP2930.getSigningHash = getSigningHash;
TransactionEIP2930.getSender = getSender;
TransactionEIP2930.verifySignature = verifySignature;

// Bind prototype methods using Function.prototype.call.bind
TransactionEIP2930.prototype.serialize = Function.prototype.call.bind(serialize) as any;
TransactionEIP2930.prototype.hash = Function.prototype.call.bind(hash) as any;
TransactionEIP2930.prototype.getSigningHash = Function.prototype.call.bind(getSigningHash) as any;
TransactionEIP2930.prototype.getSender = Function.prototype.call.bind(getSender) as any;
TransactionEIP2930.prototype.verifySignature = Function.prototype.call.bind(verifySignature) as any;
