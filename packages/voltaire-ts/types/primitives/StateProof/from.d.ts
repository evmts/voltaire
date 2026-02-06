/**
 * @typedef {import('./StateProofType.js').StateProofType} StateProofType
 * @typedef {import('./StateProofType.js').StateProofLike} StateProofLike
 */
/**
 * Creates a StateProof from an object with all required fields.
 *
 * @param {StateProofLike} proof - Object containing all StateProof fields
 * @returns {StateProofType} - A validated StateProof
 *
 * @example
 * ```typescript
 * const proof = StateProof.from({
 *   address: Address.from("0x..."),
 *   accountProof: [node1, node2, node3],
 *   balance: Wei.from(1000000000000000000n),
 *   codeHash: Hash.from("0x..."),
 *   nonce: Nonce.from(5n),
 *   storageHash: StateRoot.from("0x..."),
 *   storageProof: [storageProof1, storageProof2],
 * });
 * ```
 */
export function from(proof: StateProofLike): StateProofType;
export type StateProofType = import("./StateProofType.js").StateProofType;
export type StateProofLike = import("./StateProofType.js").StateProofLike;
//# sourceMappingURL=from.d.ts.map