/**
 * @typedef {import('./StateProofType.js').StateProofType} StateProofType
 */
/**
 * Compares two StateProofs for equality.
 * All fields must match including all storage proofs.
 *
 * @param {StateProofType} a - First StateProof
 * @param {StateProofType} b - Second StateProof
 * @returns {boolean} - True if equal
 *
 * @example
 * ```typescript
 * const isEqual = StateProof.equals(proof1, proof2);
 * ```
 */
export function equals(a: StateProofType, b: StateProofType): boolean;
export type StateProofType = import("./StateProofType.js").StateProofType;
//# sourceMappingURL=equals.d.ts.map