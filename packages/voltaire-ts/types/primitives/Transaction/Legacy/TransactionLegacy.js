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
// Import crypto dependencies
import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { recoverPublicKey as secp256k1RecoverPublicKey, verify as secp256k1Verify, } from "../../../crypto/Secp256k1/index.js";
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
    secp256k1Verify,
});
// Re-export types
export * from "./TransactionLegacyType.js";
// Re-export factories for tree-shaking
export { Hash, GetSigningHash, VerifySignature };
// Re-export method functions (instantiated with crypto)
export { deserialize, getChainId, getSender, getSigningHash, hash, serialize, verifySignature, };
/**
 * @typedef {import('./TransactionLegacyType.js').TransactionLegacyType} TransactionLegacyType
 * @typedef {import('./TransactionLegacyConstructor.js').TransactionLegacyConstructor} TransactionLegacyConstructor
 */
/**
 * Factory function for creating Legacy Transaction instances
 *
 * @type {TransactionLegacyConstructor}
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
TransactionLegacy.deserialize = deserialize;
TransactionLegacy.serialize = (tx) => serialize.call(tx);
TransactionLegacy.hash = (tx) => hash.call(tx);
TransactionLegacy.getChainId = (tx) => getChainId.call(tx);
TransactionLegacy.getSigningHash = (tx) => getSigningHash.call(tx);
TransactionLegacy.getSender = (tx) => getSender.call(tx);
TransactionLegacy.verifySignature = (tx) => verifySignature.call(tx);
// Bind prototype methods using Function.prototype.call.bind
TransactionLegacy.prototype = {};
TransactionLegacy.prototype.serialize = Function.prototype.call.bind(serialize);
TransactionLegacy.prototype.hash = Function.prototype.call.bind(hash);
TransactionLegacy.prototype.getChainId =
    Function.prototype.call.bind(getChainId);
TransactionLegacy.prototype.getSigningHash =
    Function.prototype.call.bind(getSigningHash);
TransactionLegacy.prototype.getSender = Function.prototype.call.bind(getSender);
TransactionLegacy.prototype.verifySignature =
    Function.prototype.call.bind(verifySignature);
