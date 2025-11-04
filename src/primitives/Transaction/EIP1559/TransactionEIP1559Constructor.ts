import type { Address } from "../../Address/index.js";
import type { Hash } from "../../Hash/index.js";
import type { AccessList } from "../types.js";
import type { BrandedTransactionEIP1559 } from "./BrandedTransactionEIP1559.js";
import type { deserialize } from "./deserialize.js";
import type { getEffectiveGasPrice } from "./getEffectiveGasPrice.js";
import type { getSender } from "./getSender.js";
import type { getSigningHash } from "./getSigningHash.js";
import type { hash } from "./hash.js";
import type { serialize } from "./serialize.js";
import type { verifySignature } from "./verifySignature.js";

type TransactionEIP1559Prototype = BrandedTransactionEIP1559 & {
	serialize: typeof serialize;
	hash: typeof hash;
	getSigningHash: typeof getSigningHash;
	getSender: typeof getSender;
	verifySignature: typeof verifySignature;
	getEffectiveGasPrice: typeof getEffectiveGasPrice;
};

export interface TransactionEIP1559Constructor {
	(tx: {
		chainId: bigint;
		nonce: bigint;
		maxPriorityFeePerGas: bigint;
		maxFeePerGas: bigint;
		gasLimit: bigint;
		to: Address | null;
		value: bigint;
		data: Uint8Array;
		accessList: AccessList;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	}): TransactionEIP1559Prototype;
	prototype: TransactionEIP1559Prototype;
	deserialize(bytes: Uint8Array): TransactionEIP1559Prototype;
	serialize: typeof serialize;
	hash: typeof hash;
	getSigningHash: typeof getSigningHash;
	getSender: typeof getSender;
	verifySignature: typeof verifySignature;
	getEffectiveGasPrice: typeof getEffectiveGasPrice;
}
