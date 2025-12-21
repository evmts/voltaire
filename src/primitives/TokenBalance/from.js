import { MAX } from "./constants.js";
import { InvalidTokenBalanceError } from "./errors.js";

/**
 * Create TokenBalance from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/token-balance for TokenBalance documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./TokenBalanceType.js').TokenBalanceType} TokenBalance value
 * @throws {InvalidTokenBalanceError} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as TokenBalance from './primitives/TokenBalance/index.js';
 * const balance = TokenBalance.from(1000000000000000000n); // 1 token with 18 decimals
 * const fromNumber = TokenBalance.from(100);
 * const fromHex = TokenBalance.from("0xff");
 * ```
 */
export function from(value) {
	let bigintValue;

	if (typeof value === "string") {
		if (value.startsWith("0x") || value.startsWith("0X")) {
			bigintValue = BigInt(value);
		} else {
			bigintValue = BigInt(value);
		}
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new InvalidTokenBalanceError(
				`TokenBalance value must be an integer: ${value}`,
				{ value },
			);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new InvalidTokenBalanceError(
			`TokenBalance value cannot be negative: ${bigintValue}`,
			{ value: bigintValue },
		);
	}

	if (bigintValue > MAX) {
		throw new InvalidTokenBalanceError(
			`TokenBalance value exceeds maximum: ${bigintValue}`,
			{ value: bigintValue, context: { max: MAX } },
		);
	}

	return /** @type {import('./TokenBalanceType.js').TokenBalanceType} */ (
		bigintValue
	);
}
