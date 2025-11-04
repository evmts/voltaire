import type { Address } from "../../Address/index.js";
import type { Type, AccessList } from "../types.js";

/**
 * Branded EIP-2930 Transaction type
 */
export type BrandedTransactionEIP2930 = {
	readonly __tag: "TransactionEIP2930";
	type: Type.EIP2930;
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
};
