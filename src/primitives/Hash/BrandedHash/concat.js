import { keccak256 } from "./keccak256.js";

/**
 * Concatenate multiple hashes and hash the result
 *
 * @param {...import('./BrandedHash.ts').BrandedHash} hashes - Hashes to concatenate
 * @returns {import('./BrandedHash.ts').BrandedHash} Hash of concatenated hashes
 *
 * @example
 * ```typescript
 * const h1 = Hash.keccak256(data1);
 * const h2 = Hash.keccak256(data2);
 * const combined = Hash.concat(h1, h2);
 * ```
 */
export function concat(...hashes) {
	const totalLength = hashes.reduce((sum, hash) => sum + hash.length, 0);
	const combined = new Uint8Array(totalLength);

	let offset = 0;
	for (const hash of hashes) {
		combined.set(hash, offset);
		offset += hash.length;
	}

	return keccak256(combined);
}
