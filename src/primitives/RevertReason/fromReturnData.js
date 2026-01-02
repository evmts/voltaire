import * as Hex from "../Hex/index.js";
import {
	ERROR_SELECTOR,
	getPanicDescription,
	PANIC_SELECTOR,
} from "./constants.js";

/**
 * Decode RevertReason from ReturnData
 *
 * @param {import('../ReturnData/ReturnDataType.js').ReturnDataType} returnData - Return data from failed call
 * @returns {import('./RevertReasonType.js').RevertReasonType} Decoded revert reason
 *
 * @example
 * ```typescript
 * const returnData = ReturnData.fromHex("0x08c379a0...");
 * const reason = RevertReason.fromReturnData(returnData);
 * if (reason.type === "Error") {
 *   console.log(reason.message);
 * }
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: revert reason parsing requires many conditions
export function fromReturnData(returnData) {
	// Empty data
	if (returnData.length === 0) {
		return {
			type: "Unknown",
			data: returnData,
		};
	}

	// Need at least 4 bytes for selector
	if (returnData.length < 4) {
		return {
			type: "Unknown",
			data: returnData,
		};
	}

	// Extract selector
	const selector = Hex.fromBytes(returnData.slice(0, 4));

	// Error(string)
	if (/** @type {string} */ (selector) === ERROR_SELECTOR) {
		try {
			// Decode string parameter
			// Data layout: selector (4 bytes) + offset (32 bytes) + length (32 bytes) + string data
			if (returnData.length < 68) {
				return { type: "Unknown", data: returnData };
			}

			// Read string length from bytes 36-68 (big-endian, MSB first)
			let length = 0;
			for (let i = 0; i < 32; i++) {
				length = (length << 8) | /** @type {number} */ (returnData[36 + i]);
			}

			// Extract string bytes
			const stringBytes = returnData.slice(68, 68 + length);
			const message = new TextDecoder().decode(stringBytes);

			return {
				type: "Error",
				message,
			};
		} catch {
			return { type: "Unknown", data: returnData };
		}
	}

	// Panic(uint256)
	if (/** @type {string} */ (selector) === PANIC_SELECTOR) {
		try {
			// Data layout: selector (4 bytes) + code (32 bytes)
			if (returnData.length < 36) {
				return { type: "Unknown", data: returnData };
			}

			// Read panic code from bytes 4-36 (big-endian, MSB first)
			let code = 0;
			for (let i = 0; i < 32; i++) {
				code = (code << 8) | /** @type {number} */ (returnData[4 + i]);
			}

			return {
				type: "Panic",
				code,
				description: getPanicDescription(code),
			};
		} catch {
			return { type: "Unknown", data: returnData };
		}
	}

	// Custom error
	return {
		type: "Custom",
		selector,
		data: returnData.slice(4),
	};
}
