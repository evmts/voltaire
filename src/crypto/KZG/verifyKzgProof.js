import * as ckzg from "c-kzg";
import {
	BYTES_PER_COMMITMENT,
	BYTES_PER_FIELD_ELEMENT,
	BYTES_PER_PROOF,
} from "./constants.js";
import { KzgError, KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";

/**
 * Verify KZG proof
 *
 * Verifies that commitment C corresponds to polynomial P where P(z) = y.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} commitment - KZG commitment (48 bytes)
 * @param {Uint8Array} z - Evaluation point (32 bytes)
 * @param {Uint8Array} y - Claimed evaluation result (32 bytes)
 * @param {Uint8Array} proof - KZG proof (48 bytes)
 * @returns {boolean} true if proof is valid, false otherwise
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgError} If verification fails due to invalid inputs
 * @example
 * ```javascript
 * import { verifyKzgProof } from './crypto/KZG/index.js';
 * const valid = verifyKzgProof(commitment, z, y, proof);
 * if (!valid) {
 *   throw new Error('Invalid proof');
 * }
 * ```
 */
export function verifyKzgProof(commitment, z, y, proof) {
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
				code: "KZG_INVALID_COMMITMENT",
				context: {
					commitmentType:
						commitment instanceof Uint8Array ? "Uint8Array" : typeof commitment,
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
				code: "KZG_INVALID_EVALUATION_POINT",
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
				code: "KZG_INVALID_EVALUATION_RESULT",
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
				code: "KZG_INVALID_PROOF",
				context: {
					proofType: proof instanceof Uint8Array ? "Uint8Array" : typeof proof,
					proofLength: proof instanceof Uint8Array ? proof.length : undefined,
					expected: BYTES_PER_PROOF,
				},
				docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
			},
		);
	}
	try {
		return ckzg.verifyKzgProof(commitment, z, y, proof);
	} catch (error) {
		// If verification fails due to bad args/invalid proof, return false
		// rather than throwing (this is a verification failure, not an error)
		if (error instanceof Error && error.message.includes("C_KZG_BADARGS")) {
			return false;
		}
		throw new KzgError(
			`Failed to verify proof: ${error instanceof Error ? error.message : String(error)}`,
			{
				code: "KZG_VERIFICATION_FAILED",
				docsPath: "/crypto/kzg/verify-kzg-proof#error-handling",
				cause: error instanceof Error ? error : undefined,
			},
		);
	}
}
