/**
 * EIP-1559 Transaction (Type 2) Factory
 *
 * Factory function pattern with both static and instance methods.
 */

// Import types
import type { TransactionEIP1559Constructor } from "./TransactionEIP1559Constructor.js";

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
export * from "./BrandedTransactionEIP1559.js";

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
 * Factory function for creating EIP-1559 Transaction instances
 */
export const TransactionEIP1559 = ((tx) => {
	return {
		__tag: "TransactionEIP1559",
		type: Type.EIP1559,
		chainId: tx.chainId,
		nonce: tx.nonce,
		maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
		maxFeePerGas: tx.maxFeePerGas,
		gasLimit: tx.gasLimit,
		to: tx.to,
		value: tx.value,
		data: tx.data,
		accessList: tx.accessList,
		yParity: tx.yParity,
		r: tx.r,
		s: tx.s,
	};
}) as TransactionEIP1559Constructor;

// Initialize prototype
TransactionEIP1559.prototype = {} as any;

// Attach static methods
TransactionEIP1559.deserialize = deserialize;
TransactionEIP1559.serialize = serialize;
TransactionEIP1559.hash = hash;
TransactionEIP1559.getSigningHash = getSigningHash;
TransactionEIP1559.getSender = getSender;
TransactionEIP1559.verifySignature = verifySignature;
TransactionEIP1559.getEffectiveGasPrice = getEffectiveGasPrice;

// Bind prototype methods using Function.prototype.call.bind
TransactionEIP1559.prototype.serialize = Function.prototype.call.bind(serialize) as any;
TransactionEIP1559.prototype.hash = Function.prototype.call.bind(hash) as any;
TransactionEIP1559.prototype.getSigningHash = Function.prototype.call.bind(getSigningHash) as any;
TransactionEIP1559.prototype.getSender = Function.prototype.call.bind(getSender) as any;
TransactionEIP1559.prototype.verifySignature = Function.prototype.call.bind(verifySignature) as any;
TransactionEIP1559.prototype.getEffectiveGasPrice = Function.prototype.call.bind(getEffectiveGasPrice) as any;
