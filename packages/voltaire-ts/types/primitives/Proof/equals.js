// @ts-nocheck
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
export function equals(a, b) {
    // Check value equality
    if (a.value.length !== b.value.length) {
        return false;
    }
    for (let i = 0; i < a.value.length; i++) {
        if (a.value[i] !== b.value[i]) {
            return false;
        }
    }
    // Check proof array length
    if (a.proof.length !== b.proof.length) {
        return false;
    }
    // Check each proof element
    for (let i = 0; i < a.proof.length; i++) {
        const proofA = a.proof[i];
        const proofB = b.proof[i];
        if (proofA.length !== proofB.length) {
            return false;
        }
        for (let j = 0; j < proofA.length; j++) {
            if (proofA[j] !== proofB[j]) {
                return false;
            }
        }
    }
    return true;
}
