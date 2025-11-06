// @ts-nocheck
export * from "./BrandedTransactionEIP7702.js";

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
 * @typedef {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} BrandedTransactionEIP7702
 * @typedef {import('./TransactionEIP7702Constructor.js').TransactionEIP7702Constructor} TransactionEIP7702Constructor
 */

/**
 * Factory function for creating EIP-7702 Transaction instances
 *
 * @type {TransactionEIP7702Constructor}
 */
export function TransactionEIP7702(tx) {
	return /** @type {BrandedTransactionEIP7702} */ ({
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
	});
}

// Initialize prototype
TransactionEIP7702.prototype = {};

// Attach static methods
TransactionEIP7702.deserialize = deserialize;
TransactionEIP7702.serialize = serialize;
TransactionEIP7702.hash = hash;
TransactionEIP7702.getSigningHash = getSigningHash;
TransactionEIP7702.getSender = getSender;
TransactionEIP7702.verifySignature = verifySignature;
TransactionEIP7702.getEffectiveGasPrice = getEffectiveGasPrice;

// Bind prototype methods using Function.prototype.call.bind
TransactionEIP7702.prototype.serialize =
	Function.prototype.call.bind(serialize);
TransactionEIP7702.prototype.hash = Function.prototype.call.bind(hash);
TransactionEIP7702.prototype.getSigningHash =
	Function.prototype.call.bind(getSigningHash);
TransactionEIP7702.prototype.getSender =
	Function.prototype.call.bind(getSender);
TransactionEIP7702.prototype.verifySignature =
	Function.prototype.call.bind(verifySignature);
TransactionEIP7702.prototype.getEffectiveGasPrice =
	Function.prototype.call.bind(getEffectiveGasPrice);
