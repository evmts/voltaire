/**
 * Convert CallData to hex string with 0x prefix
 *
 * @param {import('./CallDataType.js').CallDataType} calldata - CallData to convert
 * @returns {import('../Hex/index.js').HexType} Lowercase hex string with 0x prefix
 *
 * @example
 * ```javascript
 * const calldata = CallData.fromBytes(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
 * console.log(CallData.toHex(calldata)); // "0xa9059cbb"
 * ```
 */
export function toHex(calldata) {
	return /** @type {import('../Hex/index.js').HexType} */ (
		`0x${Array.from(calldata, (b) => b.toString(16).padStart(2, "0")).join("")}`
	);
}
