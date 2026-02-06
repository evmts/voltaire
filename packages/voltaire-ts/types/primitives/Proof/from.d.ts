/**
 * @typedef {import('./ProofType.js').ProofType} ProofType
 * @typedef {import('./ProofType.js').ProofLike} ProofLike
 */
/**
 * Creates a Proof from an object with value and proof array.
 *
 * @param {ProofLike} proof - Object containing value and proof array
 * @returns {ProofType} - A validated Proof
 *
 * @example
 * ```typescript
 * const proof = Proof.from({
 *   value: leafValue,
 *   proof: [hash1, hash2, hash3],
 * });
 * ```
 */
export function from(proof: ProofLike): ProofType;
export type ProofType = import("./ProofType.js").ProofType;
export type ProofLike = import("./ProofType.js").ProofLike;
//# sourceMappingURL=from.d.ts.map