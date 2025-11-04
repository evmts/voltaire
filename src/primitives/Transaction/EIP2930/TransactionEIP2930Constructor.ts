import type { Address } from "../../Address/index.js";
import type { Hash } from "../../Hash/index.js";
import type { AccessList } from "../types.js";
import type { BrandedTransactionEIP2930 } from "./BrandedTransactionEIP2930.js";
import type { deserialize } from "./deserialize.js";
import type { getSender } from "./getSender.js";
import type { getSigningHash } from "./getSigningHash.js";
import type { hash } from "./hash.js";
import type { serialize } from "./serialize.js";
import type { verifySignature } from "./verifySignature.js";

type TransactionEIP2930Prototype = BrandedTransactionEIP2930 & {
	serialize: typeof serialize;
	hash: typeof hash;
	getSigningHash: typeof getSigningHash;
	getSender: typeof getSender;
	verifySignature: typeof verifySignature;
};

export interface TransactionEIP2930Constructor {
	(tx: {
		chainId: bigint;
		nonce: bigint;
		gasPrice: bigint;
		gasLimit: bigint;
		to: Address | null;
		value: bigint;
		data: Uint8Array;
		accessList: AccessList;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	}): BrandedTransactionEIP2930;
	prototype: TransactionEIP2930Prototype;
	deserialize: typeof deserialize;
	serialize: typeof serialize;
	hash: typeof hash;
	getSigningHash: typeof getSigningHash;
	getSender: typeof getSender;
	verifySignature: typeof verifySignature;
}
