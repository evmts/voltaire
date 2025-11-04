import type { Address } from "../../Address/index.js";
import type { BrandedAuthorization } from "./BrandedAuthorization.js";
import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get authorizing address from signature
 */
export function getAuthorizer(auth: BrandedAuthorization): Address {
	const signingHash = getSigningHash(auth);
	const v = 27 + auth.yParity;
	return recoverAddress({ r: auth.r, s: auth.s, v }, signingHash);
}
