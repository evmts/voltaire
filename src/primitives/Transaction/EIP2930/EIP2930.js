// @ts-nocheck
export * from "./BrandedTransactionEIP2930.js";

import { Type } from "../types.js";
import { deserialize } from "./deserialize.js";
import { getSender } from "./getSender.js";
import { GetSigningHash } from "./getSigningHash.js";
import { Hash } from "./hash.js";
import { serialize } from "./serialize.js";
import { VerifySignature } from "./verifySignature.js";

// Import crypto dependencies
import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../../Rlp/BrandedRlp/encode.js";
import { recoverPublicKey as secp256k1RecoverPublicKey, verify as secp256k1Verify } from "../../../crypto/Secp256k1/index.js";

// Create instantiated methods with crypto
const getSigningHash = GetSigningHash({ keccak256, rlpEncode });
const hash = Hash({ keccak256 });
const verifySignature = VerifySignature({ keccak256, rlpEncode, secp256k1RecoverPublicKey, secp256k1Verify });

// Re-export factories for tree-shaking
export { Hash, GetSigningHash, VerifySignature };

// Export individual functions (instantiated with crypto)
export {
	deserialize,
	serialize,
	hash,
	getSigningHash,
	getSender,
	verifySignature,
};

/**
 * @typedef {import('./BrandedTransactionEIP2930.js').BrandedTransactionEIP2930} BrandedTransactionEIP2930
 * @typedef {import('./TransactionEIP2930Constructor.js').TransactionEIP2930Constructor} TransactionEIP2930Constructor
 */

/**
 * Factory function for creating EIP-2930 Transaction instances
 *
 * @type {TransactionEIP2930Constructor}
 */
export function TransactionEIP2930(tx) {
	return /** @type {BrandedTransactionEIP2930} */ ({
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
	});
}

// Attach static methods
TransactionEIP2930.deserialize = (bytes) => deserialize(bytes);
TransactionEIP2930.deserialize.prototype = TransactionEIP2930.prototype;

TransactionEIP2930.serialize = serialize;
TransactionEIP2930.hash = hash;
TransactionEIP2930.getSigningHash = getSigningHash;
TransactionEIP2930.getSender = getSender;
TransactionEIP2930.verifySignature = verifySignature;

// Bind prototype methods using Function.prototype.call.bind
TransactionEIP2930.prototype = {};
TransactionEIP2930.prototype.serialize =
	Function.prototype.call.bind(serialize);
TransactionEIP2930.prototype.hash = Function.prototype.call.bind(hash);
TransactionEIP2930.prototype.getSigningHash =
	Function.prototype.call.bind(getSigningHash);
TransactionEIP2930.prototype.getSender =
	Function.prototype.call.bind(getSender);
TransactionEIP2930.prototype.verifySignature =
	Function.prototype.call.bind(verifySignature);
