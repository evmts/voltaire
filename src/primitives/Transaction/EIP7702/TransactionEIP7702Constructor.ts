import type { BrandedAddress } from "../../Address/index.js";
import type { BrandedHash } from "../../Hash/index.js";
import type { AccessList, AuthorizationList } from "../types.js";
import type { BrandedTransactionEIP7702 } from "./BrandedTransactionEIP7702.js";
import type { deserialize } from "./deserialize.js";
import type { getEffectiveGasPrice } from "./getEffectiveGasPrice.js";
import type { getSender } from "./getSender.js";
import type { getSigningHash } from "./getSigningHash.js";
import type { hash } from "./hash.js";
import type { serialize } from "./serialize.js";
import type { verifySignature } from "./verifySignature.js";

type TransactionEIP7702Prototype = BrandedTransactionEIP7702 & {
	serialize: typeof serialize;
	hash: typeof hash;
	getSigningHash: typeof getSigningHash;
	getSender: typeof getSender;
	verifySignature: typeof verifySignature;
	getEffectiveGasPrice: typeof getEffectiveGasPrice;
};

export interface TransactionEIP7702Constructor {
	(tx: {
		chainId: bigint;
		nonce: bigint;
		maxPriorityFeePerGas: bigint;
		maxFeePerGas: bigint;
		gasLimit: bigint;
		to: BrandedAddress | null;
		value: bigint;
		data: Uint8Array;
		accessList: AccessList;
		authorizationList: AuthorizationList;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	}): TransactionEIP7702Prototype;
	prototype: TransactionEIP7702Prototype;
	deserialize(bytes: Uint8Array): TransactionEIP7702Prototype;
	serialize: typeof serialize;
	hash: typeof hash;
	getSigningHash: typeof getSigningHash;
	getSender: typeof getSender;
	verifySignature: typeof verifySignature;
	getEffectiveGasPrice: typeof getEffectiveGasPrice;
}
