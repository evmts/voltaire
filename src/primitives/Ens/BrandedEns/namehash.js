import { fromBytes } from "../../Hex/fromBytes.js";

/**
 * Factory: Create ENS namehash function with explicit crypto dependency
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(name: import('./BrandedEns.js').BrandedEns) => import('../../Hex/BrandedHex/BrandedHex.js').BrandedHex} Function that computes ENS namehash
 */
export function Namehash({ keccak256 }) {
	/**
	 * Compute ENS namehash for a given name
	 *
	 * Implements EIP-137: namehash(name) = keccak256(namehash(parent) ‖ labelhash(label))
	 * Empty string has hash of 32 zero bytes.
	 *
	 * @param {import('./BrandedEns.js').BrandedEns} name - ENS name
	 * @returns {import('../../Hex/BrandedHex/BrandedHex.js').BrandedHex} - ENS namehash as hex string
	 */
	return function namehash(name) {
		// Start with root hash (32 zero bytes)
		/** @type {Uint8Array} */
		let hash = new Uint8Array(32);

		// Empty string returns root hash
		if (!name || name.length === 0) {
			return fromBytes(hash);
		}

		// Split into labels and process in reverse order
		const labels = name.split(".");

		for (let i = labels.length - 1; i >= 0; i--) {
			const label = labels[i];
			if (label === undefined || label.length === 0) continue;

			// Hash the label
			const labelHash = keccak256(new TextEncoder().encode(label));

			// Concatenate parent hash and label hash, then hash again
			const combined = new Uint8Array(64);
			combined.set(new Uint8Array(hash), 0);
			combined.set(new Uint8Array(labelHash), 32);
			hash = new Uint8Array(keccak256(combined));
		}

		return fromBytes(hash);
	};
}
