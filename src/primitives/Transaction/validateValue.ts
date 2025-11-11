import { InvalidRangeError } from "../errors/index.js";

/**
 * Validate value is valid
 * @param this Transaction
 * @throws {InvalidRangeError} If value is negative
 */
export function validateValue(this: { value: bigint }): void {
	if (this.value < 0n) {
		throw new InvalidRangeError("Value cannot be negative", {
			code: "INVALID_VALUE",
			value: this.value,
			expected: "Non-negative value",
			docsPath: "/primitives/transaction/validate-value#error-handling",
		});
	}
}
