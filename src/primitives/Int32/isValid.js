/**
 * Check if value is a valid Int32
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if valid Int32
 */
export function isValid(value) {
	if (typeof value !== "number") {
		return false;
	}

	if (!Number.isFinite(value)) {
		return false;
	}

	const truncated = value | 0;

	return (
		truncated === value && truncated >= -2147483648 && truncated <= 2147483647
	);
}
