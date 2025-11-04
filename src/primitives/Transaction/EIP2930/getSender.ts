import type { Address } from "../../Address/index.js";
import type { BrandedTransactionEIP2930 } from "./BrandedTransactionEIP2930.js";
import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from signature
 */
export function getSender(tx: BrandedTransactionEIP2930): Address {
	const signingHash = getSigningHash(tx);
	const v = 27 + tx.yParity;
	return recoverAddress({ r: tx.r, s: tx.s, v }, signingHash);
}
