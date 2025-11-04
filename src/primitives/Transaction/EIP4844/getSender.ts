import type { Address } from "../../Address/index.js";
import type { BrandedTransactionEIP4844 } from "./BrandedTransactionEIP4844.js";
import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from signature
 */
export function getSender(tx: BrandedTransactionEIP4844): Address {
	const signingHash = getSigningHash(tx);
	const v = 27 + tx.yParity;
	return recoverAddress({ r: tx.r, s: tx.s, v }, signingHash);
}
