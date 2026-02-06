/**
 * @typedef {import('./StorageProofType.js').StorageProofType} StorageProofType
 * @typedef {import('./StorageProofType.js').StorageProofLike} StorageProofLike
 */
/**
 * Creates a StorageProof from an object with key, value, and proof array.
 *
 * @param {StorageProofLike} storageProof - Object containing key, value, and proof
 * @returns {StorageProofType} - A validated StorageProof
 *
 * @example
 * ```typescript
 * const proof = StorageProof.from({
 *   key: storageKey,
 *   value: storageValue,
 *   proof: [node1, node2, node3],
 * });
 * ```
 */
export function from(storageProof: StorageProofLike): StorageProofType;
export type StorageProofType = import("./StorageProofType.js").StorageProofType;
export type StorageProofLike = import("./StorageProofType.js").StorageProofLike;
//# sourceMappingURL=from.d.ts.map