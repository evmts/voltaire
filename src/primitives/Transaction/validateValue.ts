/**
 * Validate value is valid
 * @param this Transaction
 * @throws Error if value invalid
 */
export function validateValue(this: { value: bigint }): void {
	if (this.value < 0n) {
		throw new Error("Value cannot be negative");
	}
}
