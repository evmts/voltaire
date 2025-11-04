import type { BrandedAddress } from "../../Address/index.js";
import type { Type, AccessList, AuthorizationList } from "../types.js";

/**
 * Branded EIP-7702 Transaction type
 */
export type BrandedTransactionEIP7702 = {
	readonly __tag: "TransactionEIP7702";
	type: Type.EIP7702;
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
};
