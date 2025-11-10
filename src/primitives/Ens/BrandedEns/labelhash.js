import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { fromBytes } from "../../Hex/fromBytes.ts";

/**
 * Compute ENS labelhash for a given label
 *
 * Implements EIP-137: labelhash(label) = keccak256(label)
 *
 * @param {import('./BrandedEns.js').BrandedEns} label - ENS label
 * @returns {import('../../Hex/BrandedHex/BrandedHex.js').BrandedHex} - ENS labelhash as hex string
 */
export function labelhash(label) {
	return fromBytes(keccak256(new TextEncoder().encode(label)));
}
