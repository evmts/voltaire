import { SELECTOR_SIZE } from "./constants.js";

/**
 * Extract 4-byte function selector from CallData
 *
 * @param {import('./CallDataType.js').CallDataType} calldata - CallData to extract selector from
 * @returns {Uint8Array} 4-byte array containing function selector (view, not copy)
 *
 * @example
 * ```javascript
 * const calldata = CallData.from("0xa9059cbb...");
 * const selector = CallData.getSelector(calldata);
 * console.log(selector); // Uint8Array [0xa9, 0x05, 0x9c, 0xbb]
 * ```
 */
export function getSelector(calldata) {
	return calldata.subarray(0, SELECTOR_SIZE);
}
