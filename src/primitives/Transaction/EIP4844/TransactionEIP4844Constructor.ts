import type { Address } from "../../Address/index.js";
import type { Hash } from "../../Hash/index.js";
import type { AccessList, VersionedHash } from "../types.js";
import type { BrandedTransactionEIP4844 } from "./BrandedTransactionEIP4844.js";
import type { deserialize } from "./deserialize.js";
import type { getBlobGasCost } from "./getBlobGasCost.js";
import type { getEffectiveGasPrice } from "./getEffectiveGasPrice.js";
import type { getSender } from "./getSender.js";
import type { getSigningHash } from "./getSigningHash.js";
import type { hash } from "./hash.js";
import type { serialize } from "./serialize.js";
import type { verifySignature } from "./verifySignature.js";

type TransactionEIP4844Prototype = BrandedTransactionEIP4844 & {
	serialize: typeof serialize;
	hash: typeof hash;
	getSigningHash: typeof getSigningHash;
	getSender: typeof getSender;
	verifySignature: typeof verifySignature;
	getEffectiveGasPrice: typeof getEffectiveGasPrice;
	getBlobGasCost: typeof getBlobGasCost;
};

export interface TransactionEIP4844Constructor {
	(tx: {
		chainId: bigint;
		nonce: bigint;
		maxPriorityFeePerGas: bigint;
		maxFeePerGas: bigint;
		gasLimit: bigint;
		to: Address;
		value: bigint;
		data: Uint8Array;
		accessList: AccessList;
		maxFeePerBlobGas: bigint;
		blobVersionedHashes: readonly VersionedHash[];
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	}): BrandedTransactionEIP4844;
	prototype: TransactionEIP4844Prototype;
	deserialize: typeof deserialize;
	serialize: typeof serialize;
	hash: typeof hash;
	getSigningHash: typeof getSigningHash;
	getSender: typeof getSender;
	verifySignature: typeof verifySignature;
	getEffectiveGasPrice: typeof getEffectiveGasPrice;
	getBlobGasCost: typeof getBlobGasCost;
}
