import {
	BYTES_PER_COMMITMENT,
	BYTES_PER_FIELD_ELEMENT,
	BYTES_PER_PROOF,
} from "./constants.js";
import { KzgError, KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";

/**
 * Factory: Verify KZG proof
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(commitment: Uint8Array, z: Uint8Array, y: Uint8Array, proof: Uint8Array) => boolean} deps.verifyKzgProof - c-kzg verifyKzgProof function
 * @returns {(commitment: Uint8Array, z: Uint8Array, y: Uint8Array, proof: Uint8Array) => boolean} Function that verifies KZG proof
 *
 * @example
 * ```typescript
 * import { VerifyKzgProof } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const verifyKzgProof = VerifyKzgProof({ verifyKzgProof: ckzg.verifyKzgProof })
 * const valid = verifyKzgProof(commitment, z, y, proof)
 * ```
 */
export function VerifyKzgProof({ verifyKzgProof: ckzgVerifyKzgProof }) {
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validation logic
	return function verifyKzgProof(commitment, z, y, proof) {
		if (!getInitialized()) {
			throw new KzgNotInitializedError();
		}
		if (
			!(commitment instanceof Uint8Array) ||
			commitment.length !== BYTES_PER_COMMITMENT
		) {
			throw new KzgError(
				`Commitment must be ${BYTES_PER_COMMITMENT} bytes, got ${commitment instanceof Uint8Array ? commitment.length : "not Uint8Array"}`,
				{
					code: -32602,
					context: {
						commitmentType:
							commitment instanceof Uint8Array
								? "Uint8Array"
								: typeof commitment,
						commitmentLength:
							commitment instanceof Uint8Array ? commitment.length : undefined,
						expected: BYTES_PER_COMMITMENT,
					},
					docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
				},
			);
		}
		if (!(z instanceof Uint8Array) || z.length !== BYTES_PER_FIELD_ELEMENT) {
			throw new KzgError(
				`Evaluation point must be ${BYTES_PER_FIELD_ELEMENT} bytes, got ${z instanceof Uint8Array ? z.length : "not Uint8Array"}`,
				{
					code: -32602,
					context: {
						zType: z instanceof Uint8Array ? "Uint8Array" : typeof z,
						zLength: z instanceof Uint8Array ? z.length : undefined,
						expected: BYTES_PER_FIELD_ELEMENT,
					},
					docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
				},
			);
		}
		if (!(y instanceof Uint8Array) || y.length !== BYTES_PER_FIELD_ELEMENT) {
			throw new KzgError(
				`Evaluation result must be ${BYTES_PER_FIELD_ELEMENT} bytes, got ${y instanceof Uint8Array ? y.length : "not Uint8Array"}`,
				{
					code: -32602,
					context: {
						yType: y instanceof Uint8Array ? "Uint8Array" : typeof y,
						yLength: y instanceof Uint8Array ? y.length : undefined,
						expected: BYTES_PER_FIELD_ELEMENT,
					},
					docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
				},
			);
		}
		if (!(proof instanceof Uint8Array) || proof.length !== BYTES_PER_PROOF) {
			throw new KzgError(
				`Proof must be ${BYTES_PER_PROOF} bytes, got ${proof instanceof Uint8Array ? proof.length : "not Uint8Array"}`,
				{
					code: -32602,
					context: {
						proofType:
							proof instanceof Uint8Array ? "Uint8Array" : typeof proof,
						proofLength: proof instanceof Uint8Array ? proof.length : undefined,
						expected: BYTES_PER_PROOF,
					},
					docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
				},
			);
		}
		try {
			return ckzgVerifyKzgProof(commitment, z, y, proof);
		} catch {
			// Verification failures (invalid points, cryptographic failures) return false
			// This is the expected semantic behavior for a verification function
			return false;
		}
	};
}
