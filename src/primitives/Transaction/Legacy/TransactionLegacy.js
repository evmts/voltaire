// @ts-nocheck
/**
 * Legacy Transaction (Type 0) Factory
 *
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { TransactionLegacy } from './TransactionLegacy.js';
 *
 * // Factory function
 * const tx = TransactionLegacy({ nonce: 0n, gasPrice: 20n, ... });
 *
 * // Static methods
 * const hash = TransactionLegacy.hash(tx);
 * const sender = TransactionLegacy.getSender(tx);
 *
 * // Instance methods
 * const hash2 = tx.hash();
 * const sender2 = tx.getSender();
 * ```
 */

// Import all method functions
import { Type } from "../types.js";
import { deserialize } from "./deserialize.js";
import { getChainId } from "./getChainId.js";
import { getSender } from "./getSender.js";
import { getSigningHash } from "./getSigningHash.js";
import { hash } from "./hash.js";
import { serialize } from "./serialize.js";
import { verifySignature } from "./verifySignature.js";

// Re-export types
export * from "./BrandedTransactionLegacy.js";

// Re-export method functions for tree-shaking
export {
	deserialize,
	getChainId,
	getSender,
	getSigningHash,
	hash,
	serialize,
	verifySignature,
};

/**
 * @typedef {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy} BrandedTransactionLegacy
 * @typedef {import('./TransactionLegacyConstructor.js').TransactionLegacyConstructor} TransactionLegacyConstructor
 */

/**
 * Factory function for creating Legacy Transaction instances
 *
 * @type {TransactionLegacyConstructor}
 */
export function TransactionLegacy(tx) {
	return {
		__tag: "TransactionLegacy",
		type: Type.Legacy,
		nonce: tx.nonce,
		gasPrice: tx.gasPrice,
		gasLimit: tx.gasLimit,
		to: tx.to,
		value: tx.value,
		data: tx.data,
		v: tx.v,
		r: tx.r,
		s: tx.s,
	};
}

// Attach static methods
TransactionLegacy.deserialize = deserialize;
TransactionLegacy.serialize = serialize;
TransactionLegacy.hash = hash;
TransactionLegacy.getChainId = getChainId;
TransactionLegacy.getSigningHash = getSigningHash;
TransactionLegacy.getSender = getSender;
TransactionLegacy.verifySignature = verifySignature;

// Bind prototype methods using Function.prototype.call.bind
TransactionLegacy.prototype = {};
TransactionLegacy.prototype.serialize = Function.prototype.call.bind(serialize);
TransactionLegacy.prototype.hash = Function.prototype.call.bind(hash);
TransactionLegacy.prototype.getChainId = Function.prototype.call.bind(getChainId);
TransactionLegacy.prototype.getSigningHash =
	Function.prototype.call.bind(getSigningHash);
TransactionLegacy.prototype.getSender = Function.prototype.call.bind(getSender);
TransactionLegacy.prototype.verifySignature =
	Function.prototype.call.bind(verifySignature);
