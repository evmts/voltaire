import { InvalidTransactionHashFormatError } from "./errors.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
/**
 * Create TransactionHash from various input types
 *
 * @param {string | Uint8Array} value
 * @returns {import('./TransactionHashType.js').TransactionHashType}
 * @throws {InvalidTransactionHashFormatError}
 */
export function from(value) {
    if (typeof value === "string") {
        return fromHex(value);
    }
    if (value instanceof Uint8Array) {
        return fromBytes(value);
    }
    throw new InvalidTransactionHashFormatError("Unsupported TransactionHash value type", {
        value,
        expected: "string or Uint8Array",
    });
}
