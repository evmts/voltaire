import { MAX } from "./constants.js";
import { InvalidMultiTokenIdError } from "./errors.js";

/**
 * Create MultiTokenId from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/multi-token-id for MultiTokenId documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./MultiTokenIdType.js').MultiTokenIdType} MultiTokenId value
 * @throws {InvalidMultiTokenIdError} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as MultiTokenId from './primitives/MultiTokenId/index.js';
 * const tokenId = MultiTokenId.from(1n); // Fungible token type
 * const nftId = MultiTokenId.from(2n ** 128n); // Non-fungible token type
 * const fromHex = MultiTokenId.from("0xff");
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
			throw new InvalidMultiTokenIdError(
				`MultiTokenId value must be an integer: ${value}`,
				{ value },
			);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new InvalidMultiTokenIdError(
			`MultiTokenId value cannot be negative: ${bigintValue}`,
			{ value: bigintValue },
		);
	}

	if (bigintValue > MAX) {
		throw new InvalidMultiTokenIdError(
			`MultiTokenId value exceeds maximum: ${bigintValue}`,
			{ value: bigintValue, max: MAX },
		);
	}

	return /** @type {import('./MultiTokenIdType.js').MultiTokenIdType} */ (
		bigintValue
	);
}
