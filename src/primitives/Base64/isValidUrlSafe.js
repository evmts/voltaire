/**
 * Check if string is valid URL-safe base64
 *
 * @param {string} str - String to validate
 * @returns {boolean} True if valid URL-safe base64
 */
export function isValidUrlSafe(str) {
	if (str.length === 0) return true;

	const urlSafeRegex = /^[A-Za-z0-9_-]*$/;
	return urlSafeRegex.test(str);
}
