// @ts-nocheck
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";

/**
 * @typedef {import('./ProofType.js').ProofType} ProofType
 */

/**
 * Error thrown when proof length doesn't match expected tree depth
 */
export class InvalidProofLengthError extends Error {
	/**
	 * @param {string} message
	 * @param {{ actual: number; expected: number }} details
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidProofLengthError";
		this.actual = details.actual;
		this.expected = details.expected;
	}
}

/**
 * Verifies a Merkle proof against a known root hash.
 *
 * This implements standard Merkle proof verification:
 * 1. Start with keccak256(value) as current hash (or value if already 32 bytes)
 * 2. For each sibling hash, combine and hash based on position
 * 3. Compare final hash with expected root
 *
 * @param {ProofType} proof - The Merkle proof to verify
 * @param {Uint8Array} expectedRoot - The expected root hash (32 bytes)
 * @param {number} leafPosition - The leaf position in the tree (0-indexed)
 * @param {{ expectedDepth?: number }} [options] - Optional verification options
 * @param {number} [options.expectedDepth] - If provided, validates proof length matches expected tree depth
 * @returns {boolean} True if the proof is valid
 * @throws {InvalidProofLengthError} If expectedDepth is provided and proof length doesn't match
 *
 * @example
 * ```typescript
 * import * as Proof from './primitives/Proof/index.js';
 *
 * const isValid = Proof.verify(proof, expectedRoot, leafPosition);
 *
 * // With depth validation
 * const isValidWithDepth = Proof.verify(proof, expectedRoot, leafPosition, { expectedDepth: 3 });
 * ```
 */
export function verify(proof, expectedRoot, leafPosition, options = {}) {
	const { expectedDepth } = options;

	// Validate proof length against expected depth if provided
	if (expectedDepth !== undefined) {
		if (proof.proof.length !== expectedDepth) {
			throw new InvalidProofLengthError(
				`Proof length ${proof.proof.length} does not match expected tree depth ${expectedDepth}`,
				{ actual: proof.proof.length, expected: expectedDepth },
			);
		}
	}

	// Validate expected root is 32 bytes
	if (expectedRoot.length !== 32) {
		return false;
	}

	// Empty proof case - value hash should equal root
	if (proof.proof.length === 0) {
		if (proof.value.length !== 32) {
			return false;
		}
		return bytesEqual(proof.value, expectedRoot);
	}

	// Start with hash of the value (or value itself if already 32 bytes)
	let current;
	if (proof.value.length === 32) {
		current = new Uint8Array(proof.value);
	} else {
		current = keccak256(proof.value);
	}

	// Walk up the tree
	let pos = leafPosition;
	for (const sibling of proof.proof) {
		// Validate sibling is 32 bytes
		if (sibling.length !== 32) {
			return false;
		}

		const combined = new Uint8Array(64);
		if ((pos & 1) === 0) {
			// Even position: hash(current || sibling)
			combined.set(current, 0);
			combined.set(sibling, 32);
		} else {
			// Odd position: hash(sibling || current)
			combined.set(sibling, 0);
			combined.set(current, 32);
		}

		current = keccak256(combined);
		pos = pos >>> 1; // Unsigned right shift for safety
	}

	return bytesEqual(current, expectedRoot);
}

/**
 * Computes the root hash from a Merkle proof.
 *
 * @param {ProofType} proof - The Merkle proof
 * @param {number} leafPosition - The leaf position in the tree (0-indexed)
 * @param {{ expectedDepth?: number }} [options] - Optional verification options
 * @param {number} [options.expectedDepth] - If provided, validates proof length matches expected tree depth
 * @returns {Uint8Array} The computed root hash (32 bytes)
 * @throws {InvalidProofLengthError} If expectedDepth is provided and proof length doesn't match
 *
 * @example
 * ```typescript
 * import * as Proof from './primitives/Proof/index.js';
 *
 * const computedRoot = Proof.computeRoot(proof, leafPosition);
 * ```
 */
export function computeRoot(proof, leafPosition, options = {}) {
	const { expectedDepth } = options;

	// Validate proof length against expected depth if provided
	if (expectedDepth !== undefined) {
		if (proof.proof.length !== expectedDepth) {
			throw new InvalidProofLengthError(
				`Proof length ${proof.proof.length} does not match expected tree depth ${expectedDepth}`,
				{ actual: proof.proof.length, expected: expectedDepth },
			);
		}
	}

	// Empty proof case - return hash of value or value itself if already 32 bytes
	if (proof.proof.length === 0) {
		if (proof.value.length === 32) {
			return new Uint8Array(proof.value);
		}
		return keccak256(proof.value);
	}

	// Start with hash of the value (or value itself if already 32 bytes)
	let current;
	if (proof.value.length === 32) {
		current = new Uint8Array(proof.value);
	} else {
		current = keccak256(proof.value);
	}

	// Walk up the tree
	let pos = leafPosition;
	for (const sibling of proof.proof) {
		const combined = new Uint8Array(64);
		if ((pos & 1) === 0) {
			// Even position: hash(current || sibling)
			combined.set(current, 0);
			combined.set(sibling, 32);
		} else {
			// Odd position: hash(sibling || current)
			combined.set(sibling, 0);
			combined.set(current, 32);
		}

		current = keccak256(combined);
		pos = pos >>> 1;
	}

	return current;
}

/**
 * Calculates the expected proof length (tree depth) for a given number of leaves.
 *
 * @param {number} numLeaves - The number of leaves in the Merkle tree
 * @returns {number} The expected proof length (tree depth)
 *
 * @example
 * ```typescript
 * import * as Proof from './primitives/Proof/index.js';
 *
 * const depth = Proof.expectedDepth(8); // Returns 3
 * const depth2 = Proof.expectedDepth(1000); // Returns 10
 * ```
 */
export function expectedDepth(numLeaves) {
	if (numLeaves <= 0) {
		return 0;
	}
	if (numLeaves === 1) {
		return 0;
	}
	return Math.ceil(Math.log2(numLeaves));
}

/**
 * Compare two byte arrays for equality.
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
function bytesEqual(a, b) {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}
