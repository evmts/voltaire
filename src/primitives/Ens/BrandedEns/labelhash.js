import { fromBytes } from "../../Hex/fromBytes.js";

/**
 * Factory: Create ENS labelhash function with explicit crypto dependency
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(label: import('./BrandedEns.js').BrandedEns) => import('../../Hex/BrandedHex/BrandedHex.js').BrandedHex} Function that computes ENS labelhash
 */
export function Labelhash({ keccak256 }) {
	/**
	 * Compute ENS labelhash for a given label
	 *
	 * Implements EIP-137: labelhash(label) = keccak256(label)
	 *
	 * @param {import('./BrandedEns.js').BrandedEns} label - ENS label
	 * @returns {import('../../Hex/BrandedHex/BrandedHex.js').BrandedHex} - ENS labelhash as hex string
	 */
	return function labelhash(label) {
		return fromBytes(keccak256(new TextEncoder().encode(label)));
	};
}
