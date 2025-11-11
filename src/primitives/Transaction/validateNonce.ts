import { InvalidRangeError } from "../errors/index.js";

/**
 * Validate nonce format
 * @param this Transaction
 * @throws {InvalidRangeError} If nonce is negative
 */
export function validateNonce(this: { nonce: bigint }): void {
	if (this.nonce < 0n) {
		throw new InvalidRangeError("Nonce cannot be negative", {
			code: "INVALID_NONCE",
			value: this.nonce,
			expected: "Non-negative nonce value",
			docsPath: "/primitives/transaction/validate-nonce#error-handling",
		});
	}
}
