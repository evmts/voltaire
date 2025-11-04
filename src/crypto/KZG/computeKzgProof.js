import * as ckzg from "c-kzg";
import { BYTES_PER_FIELD_ELEMENT } from "./constants.js";
import { KzgError, KzgNotInitializedError } from "./errors.ts";
import { getInitialized } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";

/**
 * Compute KZG proof for blob at evaluation point z
 *
 * Generates proof that polynomial(z) = y.
 *
 * @param {Uint8Array} blob - Blob data (131072 bytes)
 * @param {Uint8Array} z - Evaluation point (32 bytes)
 * @returns {{proof: Uint8Array, y: Uint8Array}} Proof and evaluation result y
 * @throws {KzgNotInitializedError} If trusted setup not loaded
 * @throws {KzgInvalidBlobError} If blob is invalid
 * @throws {KzgError} If proof computation fails
 *
 * @example
 * ```typescript
 * const blob = new Uint8Array(131072);
 * const z = new Uint8Array(32);
 * const { proof, y } = computeKzgProof(blob, z);
 * ```
 */
export function computeKzgProof(blob, z) {
	if (!getInitialized()) {
		throw new KzgNotInitializedError();
	}
	validateBlob(blob);
	if (!(z instanceof Uint8Array) || z.length !== BYTES_PER_FIELD_ELEMENT) {
		throw new KzgError(
			`Evaluation point must be ${BYTES_PER_FIELD_ELEMENT} bytes, got ${z instanceof Uint8Array ? z.length : "not Uint8Array"}`,
		);
	}
	try {
		const result = ckzg.computeKzgProof(blob, z);
		return {
			proof: result[0],
			y: result[1],
		};
	} catch (error) {
		throw new KzgError(
			`Failed to compute proof: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
