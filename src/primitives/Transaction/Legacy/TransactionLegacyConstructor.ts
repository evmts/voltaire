import type { Address } from "../../Address/index.js";
import type { Hash } from "../../Hash/index.js";
import type { BrandedTransactionLegacy } from "./BrandedTransactionLegacy.js";
import type { deserialize } from "./deserialize.js";
import type { getChainId } from "./getChainId.js";
import type { getSender } from "./getSender.js";
import type { getSigningHash } from "./getSigningHash.js";
import type { hash } from "./hash.js";
import type { serialize } from "./serialize.js";
import type { verifySignature } from "./verifySignature.js";

type TransactionLegacyPrototype = BrandedTransactionLegacy & {
	serialize: typeof serialize;
	hash: typeof hash;
	getChainId: typeof getChainId;
	getSigningHash: typeof getSigningHash;
	getSender: typeof getSender;
	verifySignature: typeof verifySignature;
};

export interface TransactionLegacyConstructor {
	(tx: {
		nonce: bigint;
		gasPrice: bigint;
		gasLimit: bigint;
		to: Address | null;
		value: bigint;
		data: Uint8Array;
		v: bigint;
		r: Uint8Array;
		s: Uint8Array;
	}): BrandedTransactionLegacy;
	prototype: TransactionLegacyPrototype;
	deserialize: typeof deserialize;
	serialize: typeof serialize;
	hash: typeof hash;
	getChainId: typeof getChainId;
	getSigningHash: typeof getSigningHash;
	getSender: typeof getSender;
	verifySignature: typeof verifySignature;
}
