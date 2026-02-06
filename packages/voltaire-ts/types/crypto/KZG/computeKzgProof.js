import { BYTES_PER_FIELD_ELEMENT } from "./constants.js";
import { KzgError, KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";
/**
 * Factory: Compute KZG proof for blob at evaluation point z
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array, z: Uint8Array) => [Uint8Array, Uint8Array]} deps.computeKzgProof - c-kzg computeKzgProof function
 * @returns {(blob: Uint8Array, z: Uint8Array) => {proof: Uint8Array, y: Uint8Array}} Function that computes KZG proof
 *
 * @example
 * ```typescript
 * import { ComputeKzgProof } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const computeKzgProof = ComputeKzgProof({ computeKzgProof: ckzg.computeKzgProof })
 * const { proof, y } = computeKzgProof(blob, z)
 * ```
 */
export function ComputeKzgProof({ computeKzgProof: ckzgComputeKzgProof }) {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validation logic
    return function computeKzgProof(blob, z) {
        if (!getInitialized()) {
            throw new KzgNotInitializedError();
        }
        validateBlob(blob);
        if (!(z instanceof Uint8Array) || z.length !== BYTES_PER_FIELD_ELEMENT) {
            throw new KzgError(`Evaluation point must be ${BYTES_PER_FIELD_ELEMENT} bytes, got ${z instanceof Uint8Array ? z.length : "not Uint8Array"}`, {
                code: -32602,
                context: {
                    zType: z instanceof Uint8Array ? "Uint8Array" : typeof z,
                    zLength: z instanceof Uint8Array ? z.length : undefined,
                    expected: BYTES_PER_FIELD_ELEMENT,
                },
                docsPath: "/crypto/kzg/compute-kzg-proof#error-handling",
            });
        }
        try {
            const result = ckzgComputeKzgProof(blob, z);
            // Handle both tuple [proof, y] and object { proof, y } formats
            if (Array.isArray(result)) {
                return {
                    proof: result[0],
                    y: result[1],
                };
            }
            return result;
        }
        catch (error) {
            throw new KzgError(`Failed to compute proof: ${error instanceof Error ? error.message : String(error)}`, {
                code: -32000,
                context: { blobLength: blob.length, zLength: z.length },
                docsPath: "/crypto/kzg/compute-kzg-proof#error-handling",
                cause: error instanceof Error ? error : undefined,
            });
        }
    };
}
