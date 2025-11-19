// @ts-nocheck

/**
 * @typedef {import('./ProofType.js').ProofType} ProofType
 * @typedef {import('./ProofType.js').ProofLike} ProofLike
 */

/**
 * Creates a Proof from an object with value and proof array.
 *
 * @param {ProofLike} proof - Object containing value and proof array
 * @returns {ProofType} - A validated Proof
 *
 * @example
 * ```typescript
 * const proof = Proof.from({
 *   value: leafValue,
 *   proof: [hash1, hash2, hash3],
 * });
 * ```
 */
export function from(proof) {
	if (!proof || typeof proof !== "object") {
		throw new TypeError("Proof must be an object with value and proof");
	}

	const { value, proof: proofArray } = proof;

	// Validate value
	if (!(value instanceof Uint8Array)) {
		throw new TypeError("Proof.value must be a Uint8Array");
	}

	// Validate proof array
	if (!Array.isArray(proofArray)) {
		throw new TypeError("Proof.proof must be an array");
	}

	// Validate each proof element is Uint8Array
	for (let i = 0; i < proofArray.length; i++) {
		if (!(proofArray[i] instanceof Uint8Array)) {
			throw new TypeError(`Proof.proof[${i}] must be a Uint8Array`);
		}
	}

	// Return immutable object
	return Object.freeze({
		value,
		proof: Object.freeze([...proofArray]),
	});
}
