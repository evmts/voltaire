/**
 * Calculate Merkle root of hash array
 * Uses keccak256 for parent node hashing
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./../BrandedHash.js').BrandedHash[]} hashes - Array of hashes (leaf nodes)
 * @returns {import('./../BrandedHash.js').BrandedHash} Merkle root hash
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
export function merkleRoot(hashes: import("./../BrandedHash.js").BrandedHash[]): import("./../BrandedHash.js").BrandedHash;
//# sourceMappingURL=merkleRoot.d.ts.map