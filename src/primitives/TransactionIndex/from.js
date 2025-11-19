import { InvalidTransactionIndexError } from "./errors.js";

/**
 * Create TransactionIndex from number
 *
 * @param {number | bigint} value
 * @returns {import('./TransactionIndexType.js').TransactionIndexType}
 * @throws {InvalidTransactionIndexError}
 */
export function from(value) {
	const num = typeof value === "bigint" ? Number(value) : value;

	if (typeof num !== "number") {
		throw new InvalidTransactionIndexError(
			"TransactionIndex must be a number or bigint",
			{
				value,
				expected: "number or bigint",
			},
		);
	}

	if (!Number.isInteger(num)) {
		throw new InvalidTransactionIndexError(
			"TransactionIndex must be an integer",
			{
				value,
				expected: "integer",
			},
		);
	}

	if (num < 0) {
		throw new InvalidTransactionIndexError(
			"TransactionIndex cannot be negative",
			{
				value,
				expected: "non-negative integer",
			},
		);
	}

	return /** @type {import('./TransactionIndexType.js').TransactionIndexType} */ (
		num
	);
}
