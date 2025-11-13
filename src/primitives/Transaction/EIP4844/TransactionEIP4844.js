// @ts-nocheck
export * from "./BrandedTransactionEIP4844.js";

import { Type } from "../types.js";
import { deserialize } from "./deserialize.js";
import { getBlobGasCost } from "./getBlobGasCost.js";
import { getEffectiveGasPrice } from "./getEffectiveGasPrice.js";
import { getSender } from "./getSender.js";
import { GetSigningHash } from "./getSigningHash.js";
import { Hash } from "./hash.js";
import { serialize } from "./serialize.js";
import { VerifySignature } from "./verifySignature.js";

// Import crypto dependencies
import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../../Rlp/BrandedRlp/encode.js";
import {
	recoverPublicKey as secp256k1RecoverPublicKey,
	verify as secp256k1Verify,
} from "../../../crypto/Secp256k1/index.js";

// Create instantiated methods with crypto
const getSigningHash = GetSigningHash({ keccak256, rlpEncode });
const hash = Hash({ keccak256 });
const verifySignature = VerifySignature({
	keccak256,
	rlpEncode,
	secp256k1RecoverPublicKey,
	secp256k1Verify,
});

// Re-export factories for tree-shaking
export { Hash, GetSigningHash, VerifySignature };

// Export individual functions (instantiated with crypto)
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
	return /** @type {BrandedTransactionEIP4844} */ ({
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
	});
}

TransactionEIP4844.deserialize = (bytes) =>
	TransactionEIP4844(deserialize(bytes));
TransactionEIP4844.deserialize.prototype = TransactionEIP4844.prototype;

TransactionEIP4844.serialize = serialize;
TransactionEIP4844.hash = hash;
TransactionEIP4844.getSigningHash = getSigningHash;
TransactionEIP4844.getSender = getSender;
TransactionEIP4844.verifySignature = verifySignature;
TransactionEIP4844.getEffectiveGasPrice = getEffectiveGasPrice;
TransactionEIP4844.getBlobGasCost = getBlobGasCost;

TransactionEIP4844.prototype.serialize =
	Function.prototype.call.bind(serialize);
TransactionEIP4844.prototype.hash = Function.prototype.call.bind(hash);
TransactionEIP4844.prototype.getSigningHash =
	Function.prototype.call.bind(getSigningHash);
TransactionEIP4844.prototype.getSender =
	Function.prototype.call.bind(getSender);
TransactionEIP4844.prototype.verifySignature =
	Function.prototype.call.bind(verifySignature);
TransactionEIP4844.prototype.getEffectiveGasPrice =
	Function.prototype.call.bind(getEffectiveGasPrice);
TransactionEIP4844.prototype.getBlobGasCost =
	Function.prototype.call.bind(getBlobGasCost);
