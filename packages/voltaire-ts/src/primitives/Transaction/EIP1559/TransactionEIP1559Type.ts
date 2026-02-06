import type { brand } from "../../../brand.js";
import type { AddressType as BrandedAddress } from "../../Address/AddressType.js";
import type { AccessList, Type } from "../types.js";

/**
 * EIP-1559 Transaction type
 */
export type TransactionEIP1559Type = {
	readonly [brand]: "TransactionEIP1559";
	type: Type.EIP1559;
	chainId: bigint;
	nonce: bigint;
	maxPriorityFeePerGas: bigint;
	maxFeePerGas: bigint;
	gasLimit: bigint;
	to: BrandedAddress | null;
	value: bigint;
	data: Uint8Array;
	accessList: AccessList;
	yParity: number;
	r: Uint8Array;
	s: Uint8Array;
};

// Backward compatibility alias
export type BrandedTransactionEIP1559 = TransactionEIP1559Type;
