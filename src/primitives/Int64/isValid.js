/**
 * Check if value is a valid Int64
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if valid Int64
 */
export function isValid(value) {
	if (typeof value !== "bigint") {
		return false;
	}

	return value >= -9223372036854775808n && value <= 9223372036854775807n;
}
