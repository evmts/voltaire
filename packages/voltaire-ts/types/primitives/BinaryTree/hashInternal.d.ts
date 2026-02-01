/**
 * Factory: Hash internal node (left || right)
 * If both children are zero, parent hash is zero
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.blake3 - BLAKE3 hash function
 * @returns {(l: Uint8Array, r: Uint8Array) => Uint8Array} Function that hashes internal node
 *
 * @example
 * ```typescript
 * import { HashInternal } from '@tevm/voltaire/BinaryTree'
 * import { blake3 } from '@noble/hashes/blake3'
 *
 * const hashInternal = HashInternal({ blake3 })
 * const left = new Uint8Array(32);
 * const right = new Uint8Array(32);
 * const hash = hashInternal(left, right);
 * console.log(hash.every(b => b === 0)); // true (both zero)
 * ```
 */
export function HashInternal({ blake3 }: {
    blake3: (data: Uint8Array) => Uint8Array;
}): (l: Uint8Array, r: Uint8Array) => Uint8Array;
//# sourceMappingURL=hashInternal.d.ts.map