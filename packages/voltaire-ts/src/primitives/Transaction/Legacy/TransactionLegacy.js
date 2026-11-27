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

// Import crypto dependencies
import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { recoverPublicKey as secp256k1RecoverPublicKey } from "../../../crypto/Secp256k1/index.js";
import { encode as rlpEncode } from "../../Rlp/encode.js";
// Import all method functions
import { Type } from "../types.js";
import { deserialize } from "./deserialize.js";
import { getChainId } from "./getChainId.js";
import { getSender } from "./getSender.js";
import { GetSigningHash } from "./getSigningHash.js";
import { Hash } from "./hash.js";
import { serialize } from "./serialize.js";
import { VerifySignature } from "./verifySignature.js";

// Create instantiated methods with crypto
const getSigningHash = GetSigningHash({ keccak256, rlpEncode });
const hash = Hash({ keccak256 });
const verifySignature = VerifySignature({
	keccak256,
	rlpEncode,
	secp256k1RecoverPublicKey,
});

// Re-export types
export * from "./TransactionLegacyType.js";
// Re-export factories for tree-shaking
// Re-export method functions (instantiated with crypto)
export {
	deserialize,
	GetSigningHash,
	getChainId,
	getSender,
	getSigningHash,
	Hash,
	hash,
	serialize,
	VerifySignature,
	verifySignature,
};

/**
 * @typedef {import('./TransactionLegacyType.js').TransactionLegacyType} TransactionLegacyType
 * @typedef {import('./TransactionLegacyConstructor.js').TransactionLegacyConstructor} TransactionLegacyConstructor
 */

/**
 * Factory function for creating Legacy Transaction instances
 *
 * @type {TransactionLegacyConstructor}
 * @param {Parameters<TransactionLegacyConstructor>[0]} tx
 */
export function TransactionLegacy(tx) {
	return /** @type {TransactionLegacyType} */ ({
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
	});
}

// Attach static methods (wrap to pass tx as `this`)
TransactionLegacy.deserialize =
	/** @type {TransactionLegacyConstructor["deserialize"]} */ (
		/** @type {unknown} */ (deserialize)
	);
TransactionLegacy.serialize = (/** @type {TransactionLegacyType} */ tx) =>
	serialize.call(tx);
TransactionLegacy.hash = (/** @type {TransactionLegacyType} */ tx) =>
	hash.call(tx);
TransactionLegacy.getChainId = (/** @type {TransactionLegacyType} */ tx) =>
	getChainId.call(tx);
TransactionLegacy.getSigningHash = (/** @type {TransactionLegacyType} */ tx) =>
	getSigningHash.call(tx);
TransactionLegacy.getSender = (/** @type {TransactionLegacyType} */ tx) =>
	getSender.call(tx);
TransactionLegacy.verifySignature = (/** @type {TransactionLegacyType} */ tx) =>
	verifySignature.call(tx);

// Bind prototype methods directly (Legacy functions use `this` binding)
TransactionLegacy.prototype =
	/** @type {TransactionLegacyConstructor["prototype"]} */ (
		/** @type {unknown} */ ({})
	);
TransactionLegacy.prototype.serialize = serialize;
TransactionLegacy.prototype.hash = hash;
TransactionLegacy.prototype.getChainId = getChainId;
TransactionLegacy.prototype.getSigningHash = getSigningHash;
TransactionLegacy.prototype.getSender = getSender;
TransactionLegacy.prototype.verifySignature = verifySignature;
