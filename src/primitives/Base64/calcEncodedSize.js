/**
 * Calculate encoded size in bytes
 *
 * @param {number} dataLength - Length of data to encode
 * @returns {number} Size of base64 output
 */
export function calcEncodedSize(dataLength) {
	return Math.ceil(dataLength / 3) * 4;
}
