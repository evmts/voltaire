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
export function verify(proof: ProofType): {
    valid: boolean;
    error?: string;
};
export type ProofType = import("./ProofType.js").ProofType;
//# sourceMappingURL=verify.d.ts.map