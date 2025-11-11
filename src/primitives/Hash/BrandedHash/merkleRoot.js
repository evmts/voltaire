import { ZERO } from "./constants.js";
import { keccak256 } from "./keccak256.js";

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
 * import * as Hash from './primitives/Hash/index.js';
 * const leaves = [
 *   Hash.keccak256(data1),
 *   Hash.keccak256(data2),
 *   Hash.keccak256(data3)
 * ];
 * const root = Hash.merkleRoot(leaves);
 * ```
 */
export function merkleRoot(hashes) {
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
				nextLevel.push(keccak256(combined));
			}
		}

		currentLevel = nextLevel;
	}

	const root = currentLevel[0];
	return root ?? ZERO;
}
