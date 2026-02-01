/**
 * @typedef {import('./ProofType.js').ProofType} ProofType
 */
/**
 * Compares two Proofs for equality.
 * Both value and all proof elements must match.
 *
 * @param {ProofType} a - First Proof
 * @param {ProofType} b - Second Proof
 * @returns {boolean} - True if equal
 *
 * @example
 * ```typescript
 * const isEqual = Proof.equals(proof1, proof2);
 * ```
 */
export function equals(a: ProofType, b: ProofType): boolean;
export type ProofType = import("./ProofType.js").ProofType;
//# sourceMappingURL=equals.d.ts.map