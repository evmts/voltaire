/**
 * Check if string is valid base64
 *
 * @param {string} str - String to validate
 * @returns {boolean} True if valid base64
 */
export function isValid(str) {
	if (str.length === 0) return true;

	const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
	if (!base64Regex.test(str)) return false;

	if (str.length % 4 !== 0) return false;

	try {
		atob(str);
		return true;
	} catch {
		return false;
	}
}
