import type { brand } from "../../../brand.js";
import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import type { Type } from "../types.js";

/**
 * Branded Legacy Transaction type
 */
export type BrandedTransactionLegacy = {
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
