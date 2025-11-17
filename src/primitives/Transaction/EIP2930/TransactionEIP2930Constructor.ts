import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { AccessList } from "../types.js";
import type { TransactionEIP2930Type } from "./TransactionEIP2930Type.js";
import type { getSender } from "./getSender.js";
import type { getSigningHash } from "./getSigningHash.js";
import type { hash } from "./hash.js";
import type { serialize } from "./serialize.js";
import type { verifySignature } from "./verifySignature.js";

type TransactionEIP2930Prototype = TransactionEIP2930Type & {
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
		to: BrandedAddress | null;
		value: bigint;
		data: Uint8Array;
		accessList: AccessList;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	}): TransactionEIP2930Prototype;
	prototype: TransactionEIP2930Prototype;
	deserialize(bytes: Uint8Array): TransactionEIP2930Prototype;
	serialize: typeof serialize;
	hash: typeof hash;
	getSigningHash: typeof getSigningHash;
	getSender: typeof getSender;
	verifySignature: typeof verifySignature;
}
