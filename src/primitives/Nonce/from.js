import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
} from "../errors/index.js";

/** Maximum uint64 value (2^64 - 1) */
const MAX_UINT64 = 18446744073709551615n;

/**
 * Create Nonce from number, bigint, or hex string
 *
 * @param {bigint | number | string} value - Value to convert
 * @returns {import('./NonceType.js').NonceType} Nonce
 * @throws {InvalidFormatError} If value is not a valid integer
 * @throws {IntegerUnderflowError} If value is negative
 * @throws {IntegerOverflowError} If value exceeds uint64 max (2^64-1)
 *
 * @example
 * ```typescript
 * const nonce1 = Nonce.from(0);
 * const nonce2 = Nonce.from(42n);
 * const nonce3 = Nonce.from("0x2a");
 * ```
 */
export function from(value) {
	/** @type {bigint} */
	let bigintValue;

	if (typeof value === "string") {
		try {
			bigintValue = BigInt(value);
		} catch {
			throw new InvalidFormatError(`Invalid Nonce string: ${value}`, {
				code: "NONCE_INVALID_STRING",
				value,
				expected: "decimal or 0x-prefixed hex string",
				docsPath: "/primitives/nonce#error-handling",
			});
		}
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new InvalidFormatError(`Nonce must be an integer: ${value}`, {
				code: "NONCE_NOT_INTEGER",
				value,
				expected: "integer value",
				docsPath: "/primitives/nonce#error-handling",
			});
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new IntegerUnderflowError(`Nonce cannot be negative: ${bigintValue}`, {
			value: bigintValue,
			min: 0n,
			type: "nonce",
			docsPath: "/primitives/nonce#error-handling",
		});
	}

	if (bigintValue > MAX_UINT64) {
		throw new IntegerOverflowError(
			`Nonce exceeds maximum uint64 (2^64-1): ${bigintValue}`,
			{
				value: bigintValue,
				max: MAX_UINT64,
				type: "nonce",
				docsPath: "/primitives/nonce#error-handling",
			},
		);
	}

	return /** @type {import('./NonceType.js').NonceType} */ (bigintValue);
}
