// @ts-nocheck
export * from "./BrandedTransactionEIP1559.js";

import { Type } from "../types.js";
import { deserialize } from "./deserialize.js";
import { getEffectiveGasPrice } from "./getEffectiveGasPrice.js";
import { getSender } from "./getSender.js";
import { getSigningHash } from "./getSigningHash.js";
import { hash } from "./hash.js";
import { serialize } from "./serialize.js";
import { verifySignature } from "./verifySignature.js";

// Export individual functions
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
 * @typedef {import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559} BrandedTransactionEIP1559
 * @typedef {import('./TransactionEIP1559Constructor.js').TransactionEIP1559Constructor} TransactionEIP1559Constructor
 */

/**
 * Factory function for creating EIP-1559 Transaction instances
 *
 * @type {TransactionEIP1559Constructor}
 */
export function TransactionEIP1559(tx) {
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
}

// Attach static methods
TransactionEIP1559.deserialize = function (bytes) {
	return deserialize(bytes);
};
TransactionEIP1559.deserialize.prototype = TransactionEIP1559.prototype;

TransactionEIP1559.serialize = serialize;
TransactionEIP1559.hash = hash;
TransactionEIP1559.getSigningHash = getSigningHash;
TransactionEIP1559.getSender = getSender;
TransactionEIP1559.verifySignature = verifySignature;
TransactionEIP1559.getEffectiveGasPrice = getEffectiveGasPrice;

// Bind prototype methods using Function.prototype.call.bind
TransactionEIP1559.prototype = {};
TransactionEIP1559.prototype.serialize =
	Function.prototype.call.bind(serialize);
TransactionEIP1559.prototype.hash = Function.prototype.call.bind(hash);
TransactionEIP1559.prototype.getSigningHash =
	Function.prototype.call.bind(getSigningHash);
TransactionEIP1559.prototype.getSender = Function.prototype.call.bind(getSender);
TransactionEIP1559.prototype.verifySignature =
	Function.prototype.call.bind(verifySignature);
TransactionEIP1559.prototype.getEffectiveGasPrice = Function.prototype.call.bind(
	getEffectiveGasPrice,
);
