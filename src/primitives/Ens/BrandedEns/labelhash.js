import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";

/**
 * Compute ENS labelhash for a given label
 *
 * Implements EIP-137: labelhash(label) = keccak256(label)
 *
 * @param {import('./BrandedEns.js').BrandedEns} label - ENS label
 * @returns {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} - ENS labelhash
 */
export function labelhash(label) {
	return keccak256(new TextEncoder().encode(label));
}
