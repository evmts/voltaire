/**
 * Calculate decoded size in bytes
 *
 * @param {number} encodedLength - Length of base64 string
 * @returns {number} Maximum size of decoded output
 */
export function calcDecodedSize(encodedLength) {
	const padding = encodedLength > 0 && encodedLength % 4 === 0 ? 2 : 0;
	return Math.floor((encodedLength * 3) / 4) - padding;
}
