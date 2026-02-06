// @ts-nocheck
/**
 * @typedef {import('./ProofType.js').ProofType} ProofType
 */
/**
 * Hash size in bytes (32 bytes = 256 bits for keccak256)
 */
const HASH_SIZE = 32;
/**
 * Validates that a proof has correctly formatted proof nodes.
 *
 * Each proof node must be a 32-byte hash (keccak256 output).
 * Returns an object with valid flag and optional error message.
 *
 * @param {ProofType} proof - The Proof to validate
 * @returns {{ valid: boolean; error?: string }} - Validation result
 *
 * @example
 * ```typescript
 * const result = Proof.verify(proof);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function verify(proof) {
    // Validate proof is an object
    if (!proof || typeof proof !== "object") {
        return { valid: false, error: "Proof must be an object" };
    }
    // Validate value exists and is Uint8Array
    if (!(proof.value instanceof Uint8Array)) {
        return { valid: false, error: "Proof.value must be a Uint8Array" };
    }
    // Validate proof array exists
    if (!Array.isArray(proof.proof)) {
        return { valid: false, error: "Proof.proof must be an array" };
    }
    // Validate each proof element is a 32-byte hash
    for (let i = 0; i < proof.proof.length; i++) {
        const node = proof.proof[i];
        if (!(node instanceof Uint8Array)) {
            return {
                valid: false,
                error: `Proof.proof[${i}] must be a Uint8Array`,
            };
        }
        if (node.length !== HASH_SIZE) {
            return {
                valid: false,
                error: `Proof.proof[${i}] must be ${HASH_SIZE} bytes (got ${node.length})`,
            };
        }
    }
    return { valid: true };
}
