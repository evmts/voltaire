import type { brand } from "../../../brand.js";
import type { AddressType as BrandedAddress } from "../../Address/AddressType.js";
import type { Type } from "../types.js";

/**
 * Branded Legacy Transaction type
 */
export type TransactionLegacyType = {
	readonly [brand]: "TransactionLegacy";
	type: Type.Legacy;
	nonce: bigint;
	gasPrice: bigint;
	gasLimit: bigint;
	to: BrandedAddress | null;
	value: bigint;
	data: Uint8Array;
	v: bigint;
	r: Uint8Array;
	s: Uint8Array;
};

/**
 * @deprecated Use TransactionLegacyType instead
 */
export type BrandedTransactionLegacy = TransactionLegacyType;
