import * as Hex from "../Hex/index.js";
import { InvalidHexFormatError } from "./errors.js";
/**
 * Create ReturnData from hex string
 *
 * @param {string} value - Hex string (with or without 0x prefix)
 * @returns {import('./ReturnDataType.js').ReturnDataType} ReturnData
 * @throws {InvalidHexFormatError} If hex string is invalid
 *
 * @example
 * ```typescript
 * const data = ReturnData.fromHex("0x00000001");
 * ```
 */
export function fromHex(value) {
    try {
        const bytes = Hex.toBytes(value);
        return /** @type {import('./ReturnDataType.js').ReturnDataType} */ (bytes);
    }
    catch (error) {
        throw new InvalidHexFormatError(error instanceof Error ? error.message : "Invalid hex format", { value });
    }
}
