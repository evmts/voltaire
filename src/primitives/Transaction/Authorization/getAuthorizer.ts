import type { Address } from "../../Address/index.js";
import type { Authorization } from "../types.js";
import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get authorizing address from signature
 */
export function getAuthorizer(this: Authorization): Address {
	const signingHash = getSigningHash.call(this);
	const v = 27 + this.yParity;
	return recoverAddress({ r: this.r, s: this.s, v }, signingHash);
}
