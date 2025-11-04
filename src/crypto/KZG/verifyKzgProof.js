import * as ckzg from "c-kzg";
import { BYTES_PER_COMMITMENT, BYTES_PER_FIELD_ELEMENT, BYTES_PER_PROOF } from "./constants.js";
import { KzgError, KzgNotInitializedError } from "./errors.ts";
import { getInitialized } from "./loadTrustedSetup.js";

/**
 * Verify KZG proof
 *
 * Verifies that commitment C corresponds to polynomial P where P(z) = y.
 *
 * @param {Uint8Array} commitment - KZG commitment (48 bytes)
 * @param {Uint8Array} z - Evaluation point (32 bytes)
 * @param {Uint8Array} y - Claimed evaluation result (32 bytes)
 * @param {Uint8Array} proof - KZG proof (48 bytes)
 * @returns {boolean} true if proof is valid, false otherwise
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgError} If verification fails due to invalid inputs
 *
 * @example
 * ```typescript
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
		);
	}
	if (!(z instanceof Uint8Array) || z.length !== BYTES_PER_FIELD_ELEMENT) {
		throw new KzgError(
			`Evaluation point must be ${BYTES_PER_FIELD_ELEMENT} bytes, got ${z instanceof Uint8Array ? z.length : "not Uint8Array"}`,
		);
	}
	if (!(y instanceof Uint8Array) || y.length !== BYTES_PER_FIELD_ELEMENT) {
		throw new KzgError(
			`Evaluation result must be ${BYTES_PER_FIELD_ELEMENT} bytes, got ${y instanceof Uint8Array ? y.length : "not Uint8Array"}`,
		);
	}
	if (!(proof instanceof Uint8Array) || proof.length !== BYTES_PER_PROOF) {
		throw new KzgError(
			`Proof must be ${BYTES_PER_PROOF} bytes, got ${proof instanceof Uint8Array ? proof.length : "not Uint8Array"}`,
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
		);
	}
}
