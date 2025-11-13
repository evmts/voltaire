import { ZERO } from "./constants.js";
import { Keccak256 } from "./keccak256.js";

/**
 * Factory: Calculate Merkle root of hash array
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(hashes: import('./BrandedHash.ts').BrandedHash[]) => import('./BrandedHash.ts').BrandedHash} Function that calculates Merkle root
 */
export function MerkleRoot({ keccak256 }) {
	const hash = Keccak256({ keccak256 });

	/**
	 * Calculate Merkle root of hash array
	 * Uses keccak256 for parent node hashing
	 *
	 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
	 * @since 0.0.0
	 * @param {import('./BrandedHash.ts').BrandedHash[]} hashes - Array of hashes (leaf nodes)
	 * @returns {import('./BrandedHash.ts').BrandedHash} Merkle root hash
	 * @throws {never}
	 * @example
	 * ```javascript
	 * import { MerkleRoot } from './primitives/Hash/index.js';
	 * import { hash as keccak256 } from './crypto/Keccak256/hash.js';
	 * const getMerkleRoot = MerkleRoot({ keccak256 });
	 * const root = getMerkleRoot([hash1, hash2, hash3]);
	 * ```
	 */
	return function merkleRoot(hashes) {
		if (hashes.length === 0) {
			return ZERO;
		}

		if (hashes.length === 1) {
			const first = hashes[0];
			if (!first) {
				return ZERO;
			}
			return first;
		}

		// Work with a copy to avoid mutating input
		let currentLevel = [...hashes];

		while (currentLevel.length > 1) {
			const nextLevel = [];

			for (let i = 0; i < currentLevel.length; i += 2) {
				const left = currentLevel[i];
				const right = currentLevel[i + 1];

				if (!left) {
					break;
				}

				if (!right) {
					// Odd number of nodes, promote the last one
					nextLevel.push(left);
				} else {
					// Combine left and right
					const combined = new Uint8Array(left.length + right.length);
					combined.set(left, 0);
					combined.set(right, left.length);
					nextLevel.push(hash(combined));
				}
			}

			currentLevel = nextLevel;
		}

		const root = currentLevel[0];
		return root ?? ZERO;
	};
}
