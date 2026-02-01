// @ts-nocheck

/**
 * @typedef {import('./StorageProofType.js').StorageProofType} StorageProofType
 * @typedef {import('./StorageProofType.js').StorageProofLike} StorageProofLike
 */

/**
 * Creates a StorageProof from an object with key, value, and proof array.
 *
 * @param {StorageProofLike} storageProof - Object containing key, value, and proof
 * @returns {StorageProofType} - A validated StorageProof
 *
 * @example
 * ```typescript
 * const proof = StorageProof.from({
 *   key: storageKey,
 *   value: storageValue,
 *   proof: [node1, node2, node3],
 * });
 * ```
 */
export function from(storageProof) {
	if (!storageProof || typeof storageProof !== "object") {
		throw new TypeError(
			"StorageProof must be an object with key, value, and proof",
		);
	}

	const { key, value, proof } = storageProof;

	// Validate key
	if (!key || typeof key !== "object") {
		throw new TypeError("StorageProof.key must be a StorageKey");
	}
	if (!key.address || !("slot" in key)) {
		throw new TypeError(
			"StorageProof.key must have address and slot properties",
		);
	}

	// Validate value
	if (!(value instanceof Uint8Array)) {
		throw new TypeError("StorageProof.value must be a StorageValue");
	}
	if (value.length !== 32) {
		throw new TypeError("StorageProof.value must be 32 bytes");
	}

	// Validate proof array
	if (!Array.isArray(proof)) {
		throw new TypeError("StorageProof.proof must be an array");
	}

	// Validate each proof element is Uint8Array (RLP-encoded node)
	for (let i = 0; i < proof.length; i++) {
		if (!(proof[i] instanceof Uint8Array)) {
			throw new TypeError(`StorageProof.proof[${i}] must be a Uint8Array`);
		}
	}

	// Return immutable object
	return Object.freeze({
		key,
		value,
		proof: Object.freeze([...proof]),
	});
}
