/**
 * Factory: Hash stem node (stem || value1 || value2 || ... || value256)
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.blake3 - BLAKE3 hash function
 * @returns {(node: import('./BinaryTreeType.js').StemNode) => Uint8Array} Function that hashes stem node
 *
 * @example
 * ```typescript
 * import { HashStem } from '@tevm/voltaire/BinaryTree'
 * import { blake3 } from '@noble/hashes/blake3'
 *
 * const hashStem = HashStem({ blake3 })
 * const stem = new Uint8Array(31);
 * const values = new Array(256).fill(null);
 * values[0] = new Uint8Array(32);
 * const node = { type: 'stem', stem, values };
 * const hash = hashStem(node);
 * ```
 */
export function HashStem({ blake3 }: {
    blake3: (data: Uint8Array) => Uint8Array;
}): (node: import("./BinaryTreeType.js").StemNode) => Uint8Array;
//# sourceMappingURL=hashStem.d.ts.map