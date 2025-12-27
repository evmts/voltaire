import * as Hex from "../Hex/index.js";
import { fromBytes } from "./fromBytes.js";
import { InvalidHexFormatError } from "./errors.js";

/**
 * Create CallData from hex string
 *
 * @param {string} hex - Hex-encoded string (with or without 0x prefix)
 * @returns {import('./CallDataType.js').CallDataType} Branded CallData
 * @throws {InvalidHexFormatError} If hex string is invalid
 * @throws {InvalidCallDataLengthError} If decoded bytes length is less than 4
 *
 * @example
 * ```javascript
 * const calldata = CallData.fromHex("0xa9059cbb...");
 * ```
 */
export function fromHex(hex) {
	try {
		// Normalize and parse hex string to bytes
		const normalized = hex.startsWith("0x") ? hex : `0x${hex}`;
		const bytes = Hex.toBytes(normalized);
		return fromBytes(bytes);
	} catch (error) {
		if (error && typeof error === "object" && "code" in error) {
			// Re-throw our own errors
			if (error.code === "INVALID_CALLDATA_LENGTH") {
				throw error;
			}
		}
		throw new InvalidHexFormatError(
			error instanceof Error ? error.message : "Invalid hex string",
		);
	}
}
