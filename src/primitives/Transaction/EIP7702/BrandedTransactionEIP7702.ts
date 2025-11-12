import type { brand } from "../../../brand.js";
import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import type { AccessList, AuthorizationList, Type } from "../types.js";

/**
 * Branded EIP-7702 Transaction type
 */
export type BrandedTransactionEIP7702 = {
	readonly [brand]: "TransactionEIP7702";
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
