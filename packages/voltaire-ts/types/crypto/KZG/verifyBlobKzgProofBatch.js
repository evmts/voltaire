import { BYTES_PER_COMMITMENT, BYTES_PER_PROOF } from "./constants.js";
import { KzgError, KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";
const assertInitialized = () => {
    if (!getInitialized()) {
        throw new KzgNotInitializedError();
    }
};
/**
 * @param {Uint8Array[]} blobs
 * @param {Uint8Array[]} commitments
 * @param {Uint8Array[]} proofs
 */
const assertEqualLengths = (blobs, commitments, proofs) => {
    if (blobs.length === commitments.length && blobs.length === proofs.length) {
        return;
    }
    throw new KzgError("Blobs, commitments, and proofs arrays must have same length", {
        code: -32602,
        context: {
            blobsLength: blobs.length,
            commitmentsLength: commitments.length,
            proofsLength: proofs.length,
        },
        docsPath: "/crypto/kzg/verify-blob-kzg-proof-batch#error-handling",
    });
};
/**
 * @param {Uint8Array[]} commitments
 */
const assertValidCommitments = (commitments) => {
    for (let i = 0; i < commitments.length; i++) {
        const commitment = commitments[i];
        const isUint8 = commitment instanceof Uint8Array;
        if (isUint8 && commitment.length === BYTES_PER_COMMITMENT) {
            continue;
        }
        throw new KzgError(`Commitment at index ${i} must be ${BYTES_PER_COMMITMENT} bytes, got ${isUint8 ? commitment.length : "not Uint8Array"}`, {
            code: -32602,
            context: {
                index: i,
                commitmentType: isUint8 ? "Uint8Array" : typeof commitment,
                commitmentLength: isUint8 ? commitment.length : undefined,
                expected: BYTES_PER_COMMITMENT,
            },
            docsPath: "/crypto/kzg/verify-blob-kzg-proof-batch#error-handling",
        });
    }
};
/**
 * @param {Uint8Array[]} proofs
 */
const assertValidProofs = (proofs) => {
    for (let i = 0; i < proofs.length; i++) {
        const proof = proofs[i];
        const isUint8 = proof instanceof Uint8Array;
        if (isUint8 && proof.length === BYTES_PER_PROOF) {
            continue;
        }
        throw new KzgError(`Proof at index ${i} must be ${BYTES_PER_PROOF} bytes, got ${isUint8 ? proof.length : "not Uint8Array"}`, {
            code: -32602,
            context: {
                index: i,
                proofType: isUint8 ? "Uint8Array" : typeof proof,
                proofLength: isUint8 ? proof.length : undefined,
                expected: BYTES_PER_PROOF,
            },
            docsPath: "/crypto/kzg/verify-blob-kzg-proof-batch#error-handling",
        });
    }
};
/**
 * Factory: Verify multiple blob KZG proofs (batch verification)
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean} deps.verifyBlobKzgProofBatch - c-kzg verifyBlobKzgProofBatch function
 * @returns {(blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean} Function that verifies batch of blob KZG proofs
 *
 * @example
 * ```typescript
 * import { VerifyBlobKzgProofBatch } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const verifyBlobKzgProofBatch = VerifyBlobKzgProofBatch({ verifyBlobKzgProofBatch: ckzg.verifyBlobKzgProofBatch })
 * const valid = verifyBlobKzgProofBatch(blobs, commitments, proofs)
 * ```
 */
export function VerifyBlobKzgProofBatch({ verifyBlobKzgProofBatch: ckzgVerifyBlobKzgProofBatch, }) {
    return function verifyBlobKzgProofBatch(blobs, commitments, proofs) {
        assertInitialized();
        assertEqualLengths(blobs, commitments, proofs);
        for (const blob of blobs) {
            validateBlob(blob);
        }
        assertValidCommitments(commitments);
        assertValidProofs(proofs);
        try {
            return ckzgVerifyBlobKzgProofBatch(blobs, commitments, proofs);
        }
        catch (error) {
            throw new KzgError(`Failed to verify batch: ${error instanceof Error ? error.message : String(error)}`, {
                code: -32000,
                context: { count: blobs.length },
                docsPath: "/crypto/kzg/verify-blob-kzg-proof-batch#error-handling",
                cause: error instanceof Error ? error : undefined,
            });
        }
    };
}
