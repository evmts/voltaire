// @ts-nocheck

import { decode } from "../Rlp/decode.js";

/**
 * @typedef {import('./ProofType.js').ProofType} ProofType
 */

/**
 * Error thrown when proof node format validation fails
 */
export class ProofValidationError extends Error {
	/**
	 * @param {string} message
	 * @param {{ index?: number, code?: string }} [options]
	 */
	constructor(message, options = {}) {
		super(message);
		this.name = "ProofValidationError";
		this.index = options.index;
		this.code = options.code ?? "PROOF_VALIDATION_ERROR";
	}
}

/**
 * Validates proof node format for Merkle Patricia Trie proofs.
 *
 * MPT nodes can be:
 * - Branch node: 17 items (16 branches + value)
 * - Extension node: 2 items (path + next node hash)
 * - Leaf node: 2 items (path + value)
 *
 * Each proof node must be valid RLP-encoded data with valid MPT structure.
 *
 * @param {ProofType} proof - Proof to validate
 * @returns {{ valid: true } | { valid: false, error: ProofValidationError }} - Validation result
 *
 * @example
 * ```typescript
 * const result = Proof.verify(proof);
 * if (!result.valid) {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function verify(proof) {
	if (!proof || typeof proof !== "object") {
		return {
			valid: false,
			error: new ProofValidationError("Proof must be an object", {
				code: "PROOF_INVALID_INPUT",
			}),
		};
	}

	if (!proof.proof || !Array.isArray(proof.proof)) {
		return {
			valid: false,
			error: new ProofValidationError("Proof.proof must be an array", {
				code: "PROOF_MISSING_ARRAY",
			}),
		};
	}

	// Validate each proof node
	for (let i = 0; i < proof.proof.length; i++) {
		const node = proof.proof[i];

		// Check node is Uint8Array
		if (!(node instanceof Uint8Array)) {
			return {
				valid: false,
				error: new ProofValidationError(
					`Proof node at index ${i} must be a Uint8Array`,
					{ index: i, code: "PROOF_NODE_INVALID_TYPE" },
				),
			};
		}

		// Check node is not empty
		if (node.length === 0) {
			return {
				valid: false,
				error: new ProofValidationError(
					`Proof node at index ${i} is empty`,
					{ index: i, code: "PROOF_NODE_EMPTY" },
				),
			};
		}

		// Try to decode as RLP
		let decoded;
		try {
			decoded = decode(node);
		} catch (err) {
			return {
				valid: false,
				error: new ProofValidationError(
					`Proof node at index ${i} is not valid RLP: ${err instanceof Error ? err.message : "unknown error"}`,
					{ index: i, code: "PROOF_NODE_INVALID_RLP" },
				),
			};
		}

		// Validate MPT node structure
		const validationResult = validateMptNode(decoded.data, i);
		if (!validationResult.valid) {
			return validationResult;
		}
	}

	return { valid: true };
}

/**
 * Validates that a decoded RLP structure is a valid MPT node.
 *
 * @param {import('../Rlp/RlpType.js').BrandedRlp} data - Decoded RLP data
 * @param {number} index - Node index for error messages
 * @returns {{ valid: true } | { valid: false, error: ProofValidationError }}
 */
function validateMptNode(data, index) {
	// MPT node must be a list
	if (data.type !== "list") {
		return {
			valid: false,
			error: new ProofValidationError(
				`Proof node at index ${index} must be an RLP list, got ${data.type}`,
				{ index, code: "PROOF_NODE_NOT_LIST" },
			),
		};
	}

	const items = data.value;
	const itemCount = items.length;

	// Valid MPT nodes have 2 items (leaf/extension) or 17 items (branch)
	if (itemCount !== 2 && itemCount !== 17) {
		return {
			valid: false,
			error: new ProofValidationError(
				`Proof node at index ${index} has invalid item count: ${itemCount}. MPT nodes must have 2 (leaf/extension) or 17 (branch) items`,
				{ index, code: "PROOF_NODE_INVALID_ITEM_COUNT" },
			),
		};
	}

	// For branch nodes (17 items), validate structure
	if (itemCount === 17) {
		// First 16 items are branch pointers (can be empty or 32 bytes)
		for (let j = 0; j < 16; j++) {
			const branch = items[j];
			if (branch.type !== "bytes") {
				return {
					valid: false,
					error: new ProofValidationError(
						`Proof node at index ${index}: branch ${j} must be bytes`,
						{ index, code: "PROOF_NODE_INVALID_BRANCH" },
					),
				};
			}
			// Branch can be empty (0 bytes) or a hash (32 bytes) or embedded node
			// We allow any length here as embedded nodes can vary
		}
		// Last item is the value (can be empty)
		if (items[16].type !== "bytes") {
			return {
				valid: false,
				error: new ProofValidationError(
					`Proof node at index ${index}: branch value must be bytes`,
					{ index, code: "PROOF_NODE_INVALID_BRANCH_VALUE" },
				),
			};
		}
	}

	// For leaf/extension nodes (2 items), validate structure
	if (itemCount === 2) {
		// First item is the path (encoded nibbles)
		if (items[0].type !== "bytes") {
			return {
				valid: false,
				error: new ProofValidationError(
					`Proof node at index ${index}: path must be bytes`,
					{ index, code: "PROOF_NODE_INVALID_PATH" },
				),
			};
		}
		// Second item is value (leaf) or next node hash (extension)
		if (items[1].type !== "bytes") {
			return {
				valid: false,
				error: new ProofValidationError(
					`Proof node at index ${index}: value/next must be bytes`,
					{ index, code: "PROOF_NODE_INVALID_VALUE" },
				),
			};
		}
	}

	return { valid: true };
}
