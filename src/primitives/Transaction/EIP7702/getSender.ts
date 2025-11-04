import type { BrandedAddress } from "../../Address/index.js";
import type { BrandedTransactionEIP7702 } from "./BrandedTransactionEIP7702.js";
import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from signature
 */
export function getSender(tx: BrandedTransactionEIP7702): BrandedAddress {
	const signingHash = getSigningHash(tx);
	const v = 27 + tx.yParity;
	return recoverAddress({ r: tx.r, s: tx.s, v }, signingHash);
}
