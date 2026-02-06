// @ts-nocheck
import { equals as storageKeyEquals } from "../State/equals.js";
import * as StorageValue from "../StorageValue/index.js";
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
export function equals(a, b) {
    // Check key equality
    if (!storageKeyEquals(a.key, b.key)) {
        return false;
    }
    // Check value equality
    if (!StorageValue.equals(a.value, b.value)) {
        return false;
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
