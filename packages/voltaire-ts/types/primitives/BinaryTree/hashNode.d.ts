/**
 * Factory: Hash any node type
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.blake3 - BLAKE3 hash function
 * @returns {(node: import('./BinaryTreeType.js').Node) => Uint8Array} Function that hashes any node type
 * @throws {InvalidTreeStateError} If node type is unknown
 *
 * @example
 * ```typescript
 * import { HashNode } from '@tevm/voltaire/BinaryTree'
 * import { blake3 } from '@noble/hashes/blake3'
 *
 * const hashNode = HashNode({ blake3 })
 * const emptyNode = { type: 'empty' };
 * const hash = hashNode(emptyNode);
 * console.log(hash.every(b => b === 0)); // true
 * ```
 */
export function HashNode({ blake3 }: {
    blake3: (data: Uint8Array) => Uint8Array;
}): (node: import("./BinaryTreeType.js").Node) => Uint8Array;
//# sourceMappingURL=hashNode.d.ts.map