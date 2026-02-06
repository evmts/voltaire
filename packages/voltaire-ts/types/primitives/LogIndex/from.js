import { InvalidLogIndexError } from "./errors.js";
/**
 * Create LogIndex from number
 *
 * @param {number | bigint} value
 * @returns {import('./LogIndexType.js').LogIndexType}
 * @throws {InvalidLogIndexError}
 */
export function from(value) {
    const num = typeof value === "bigint" ? Number(value) : value;
    if (typeof num !== "number") {
        throw new InvalidLogIndexError("LogIndex must be a number or bigint", {
            value,
            expected: "number or bigint",
        });
    }
    if (!Number.isInteger(num)) {
        throw new InvalidLogIndexError("LogIndex must be an integer", {
            value,
            expected: "integer",
        });
    }
    if (num < 0) {
        throw new InvalidLogIndexError("LogIndex cannot be negative", {
            value,
            expected: "non-negative integer",
        });
    }
    return /** @type {import('./LogIndexType.js').LogIndexType} */ (num);
}
