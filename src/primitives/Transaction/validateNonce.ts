/**
 * Validate nonce format
 * @param this Transaction
 * @throws Error if nonce invalid
 */
export function validateNonce(this: { nonce: bigint }): void {
	if (this.nonce < 0n) {
		throw new Error("Nonce cannot be negative");
	}
}
