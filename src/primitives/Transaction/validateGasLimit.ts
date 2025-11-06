/**
 * Validate gas limit is valid
 * @param this Transaction
 * @throws Error if gas limit invalid
 */
export function validateGasLimit(this: { gasLimit: bigint }): void {
	if (this.gasLimit <= 0n) {
		throw new Error("Gas limit must be positive");
	}
	// Check gas limit doesn't exceed reasonable maximum (30M gas)
	const MAX_GAS_LIMIT = 30_000_000n;
	if (this.gasLimit > MAX_GAS_LIMIT) {
		throw new Error(`Gas limit exceeds maximum of ${MAX_GAS_LIMIT}`);
	}
}
