import type { BrandedAddress } from "../../Address/index.js";
import type { Type, AccessList, VersionedHash } from "../types.js";

/**
 * Branded EIP-4844 Transaction type
 */
export type BrandedTransactionEIP4844 = {
	readonly __tag: "TransactionEIP4844";
	type: Type.EIP4844;
	chainId: bigint;
	nonce: bigint;
	maxPriorityFeePerGas: bigint;
	maxFeePerGas: bigint;
	gasLimit: bigint;
	to: BrandedAddress;
	value: bigint;
	data: Uint8Array;
	accessList: AccessList;
	maxFeePerBlobGas: bigint;
	blobVersionedHashes: readonly VersionedHash[];
	yParity: number;
	r: Uint8Array;
	s: Uint8Array;
};
