import * as Hex from "../Hex/index.js";
import {
	ERROR_SELECTOR,
	getPanicDescription,
	PANIC_SELECTOR,
} from "./constants.js";

/**
 * Read a 32-byte big-endian unsigned integer into a JS number
 * @param {Uint8Array} data
 * @param {number} offset
 * @returns {number}
 */
function readUint32Word(data, offset) {
	let value = 0;
	for (let i = 0; i < 32; i++) {
		value = (value << 8) | /** @type {number} */ (data[offset + i]);
	}
	return value;
}

/**
 * Decode Error(string) payload
 * @param {import('../ReturnData/ReturnDataType.js').ReturnDataType} returnData
 * @returns {import('./RevertReasonType.js').RevertReasonType}
 */
function decodeErrorString(returnData) {
	try {
		if (returnData.length < 68) {
			return { type: "Unknown", data: returnData };
		}
		const length = readUint32Word(returnData, 36);
		const message = new TextDecoder().decode(returnData.slice(68, 68 + length));
		return { type: "Error", message };
	} catch {
		return { type: "Unknown", data: returnData };
	}
}

/**
 * Decode Panic(uint256) payload
 * @param {import('../ReturnData/ReturnDataType.js').ReturnDataType} returnData
 * @returns {import('./RevertReasonType.js').RevertReasonType}
 */
function decodePanicCode(returnData) {
	try {
		if (returnData.length < 36) {
			return { type: "Unknown", data: returnData };
		}
		const code = readUint32Word(returnData, 4);
		return { type: "Panic", code, description: getPanicDescription(code) };
	} catch {
		return { type: "Unknown", data: returnData };
	}
}

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
export function fromReturnData(returnData) {
	if (returnData.length < 4) {
		return { type: "Unknown", data: returnData };
	}

	const selector = Hex.fromBytes(returnData.slice(0, 4));
	if (/** @type {string} */ (selector) === ERROR_SELECTOR) {
		return decodeErrorString(returnData);
	}
	if (/** @type {string} */ (selector) === PANIC_SELECTOR) {
		return decodePanicCode(returnData);
	}

	return {
		type: "Custom",
		selector,
		data: returnData.slice(4),
	};
}
