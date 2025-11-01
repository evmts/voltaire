import type { Address } from "../../Address/index.js";
import type { EIP2930 } from "../types.js";
import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from signature
 */
export function getSender(this: EIP2930): Address {
	const signingHash = getSigningHash.call(this);
	const v = 27 + this.yParity;
	return recoverAddress({ r: this.r, s: this.s, v }, signingHash);
}
