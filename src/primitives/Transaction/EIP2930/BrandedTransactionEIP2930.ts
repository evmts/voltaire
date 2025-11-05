import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import type { AccessList, Type } from "../types.js";

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
	to: BrandedAddress | null;
	value: bigint;
	data: Uint8Array;
	accessList: AccessList;
	yParity: number;
	r: Uint8Array;
	s: Uint8Array;
};
