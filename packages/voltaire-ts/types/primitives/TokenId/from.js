import { MAX } from "./constants.js";
import { InvalidTokenIdError } from "./errors.js";
/**
 * Create TokenId from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/token-id for TokenId documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./TokenIdType.js').TokenIdType} TokenId value
 * @throws {InvalidTokenIdError} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as TokenId from './primitives/TokenId/index.js';
 * const tokenId = TokenId.from(42n);
 * const fromNumber = TokenId.from(100);
 * const fromHex = TokenId.from("0xff");
 * ```
 */
export function from(value) {
    let bigintValue;
    if (typeof value === "string") {
        if (value.startsWith("0x") || value.startsWith("0X")) {
            bigintValue = BigInt(value);
        }
        else {
            bigintValue = BigInt(value);
        }
    }
    else if (typeof value === "number") {
        if (!Number.isInteger(value)) {
            throw new InvalidTokenIdError(`TokenId value must be an integer: ${value}`, { value });
        }
        bigintValue = BigInt(value);
    }
    else {
        bigintValue = value;
    }
    if (bigintValue < 0n) {
        throw new InvalidTokenIdError(`TokenId value cannot be negative: ${bigintValue}`, { value: bigintValue });
    }
    if (bigintValue > MAX) {
        throw new InvalidTokenIdError(`TokenId value exceeds maximum: ${bigintValue}`, { value: bigintValue, context: { max: MAX } });
    }
    return /** @type {import('./TokenIdType.js').TokenIdType} */ (bigintValue);
}
