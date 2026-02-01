import { InvalidBlockNumberError } from "./errors.js";

/**
 * Create BlockNumber from number or bigint
 *
 * @param {number | bigint} value
 * @returns {import('./BlockNumberType.js').BlockNumberType}
 * @throws {InvalidBlockNumberError}
 */
export function from(value) {
	const num = typeof value === "number" ? BigInt(value) : value;

	if (typeof num !== "bigint") {
		throw new InvalidBlockNumberError(
			"BlockNumber must be a number or bigint",
			{
				value,
				expected: "number or bigint",
			},
		);
	}

	if (num < 0n) {
		throw new InvalidBlockNumberError("BlockNumber cannot be negative", {
			value,
			expected: "non-negative integer",
		});
	}

	return /** @type {import('./BlockNumberType.js').BlockNumberType} */ (num);
}
