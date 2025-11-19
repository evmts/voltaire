/**
 * Convert TransactionHash to hex string
 *
 * @param {import('./TransactionHashType.js').TransactionHashType} hash
 * @returns {string}
 */
export function toHex(hash) {
	let result = "0x";
	for (let i = 0; i < hash.length; i++) {
		result += hash[i].toString(16).padStart(2, "0");
	}
	return result;
}
