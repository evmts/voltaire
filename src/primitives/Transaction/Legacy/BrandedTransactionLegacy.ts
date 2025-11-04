import type { BrandedAddress } from "../../Address/index.js";
import type { Type } from "../types.js";

/**
 * Branded Legacy Transaction type
 */
export type BrandedTransactionLegacy = {
	readonly __tag: "TransactionLegacy";
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
