import type { Address } from "../../Address/index.js";
import type { AccessList, Type } from "../types.js";

/**
 * Branded EIP-1559 Transaction type
 */
export type BrandedTransactionEIP1559 = {
	readonly __tag: "TransactionEIP1559";
	type: Type.EIP1559;
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
};
