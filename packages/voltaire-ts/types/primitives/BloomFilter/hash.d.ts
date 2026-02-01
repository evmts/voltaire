/**
 * Compute Keccak-256 hash and extract bit position for bloom filter
 *
 * Per Ethereum Yellow Paper: m(x, i) = KEC(x)[i, i + 1] mod 2048
 * Takes bytes at positions [0,1], [2,3], [4,5] from Keccak-256 hash
 * and converts each pair to a 16-bit big-endian integer mod 2048.
 *
 * @param {Uint8Array} keccakHash - Pre-computed Keccak-256 hash
 * @param {number} seed - Hash index (0, 1, or 2 for standard Ethereum bloom)
 * @param {number} m - Number of bits in filter (2048 for Ethereum)
 * @returns {number} Bit position in filter
 */
export function hashFromKeccak(keccakHash: Uint8Array, seed: number, m: number): number;
/**
 * Ethereum bloom filter hash function
 *
 * Per Ethereum Yellow Paper: m(x, i) = KEC(x)[i, i + 1] mod 2048
 * Computes Keccak-256 of item, then extracts bit position.
 *
 * Note: For efficiency, prefer computing keccak256 once and calling
 * hashFromKeccak() for each seed when adding/checking items.
 *
 * @param {Uint8Array} item - Item to hash
 * @param {number} seed - Hash index (0, 1, or 2 for standard Ethereum bloom)
 * @param {number} m - Number of bits in filter (2048 for Ethereum)
 * @returns {number} Bit position in filter
 */
export function hash(item: Uint8Array, seed: number, m: number): number;
//# sourceMappingURL=hash.d.ts.map