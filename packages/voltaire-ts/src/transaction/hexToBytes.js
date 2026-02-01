/**
 * Convert hex string to Uint8Array
 * @param {string} hex
 * @returns {Uint8Array}
 */
export function hexToBytes(hex) {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}
