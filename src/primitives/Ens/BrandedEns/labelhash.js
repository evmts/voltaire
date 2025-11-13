/**
 * Factory: Create ENS labelhash function with explicit crypto dependency
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(label: import('./BrandedEns.js').BrandedEns) => Uint8Array} Function that computes ENS labelhash
 */
export function Labelhash({ keccak256 }) {
	/**
	 * Compute ENS labelhash for a given label
	 *
	 * Implements EIP-137: labelhash(label) = keccak256(label)
	 *
	 * @param {import('./BrandedEns.js').BrandedEns} label - ENS label
	 * @returns {Uint8Array} - ENS labelhash as bytes
	 */
	return function labelhash(label) {
		return keccak256(new TextEncoder().encode(label));
	};
}
