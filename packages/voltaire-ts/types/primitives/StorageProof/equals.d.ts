/**
 * @typedef {import('./StorageProofType.js').StorageProofType} StorageProofType
 */
/**
 * Compares two StorageProofs for equality.
 * All fields (key, value, and proof elements) must match.
 *
 * @param {StorageProofType} a - First StorageProof
 * @param {StorageProofType} b - Second StorageProof
 * @returns {boolean} - True if equal
 *
 * @example
 * ```typescript
 * const isEqual = StorageProof.equals(proof1, proof2);
 * ```
 */
export function equals(a: StorageProofType, b: StorageProofType): boolean;
export type StorageProofType = import("./StorageProofType.js").StorageProofType;
//# sourceMappingURL=equals.d.ts.map