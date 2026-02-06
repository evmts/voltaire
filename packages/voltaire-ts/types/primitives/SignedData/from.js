import { EIP191_PREFIX, VERSION_DATA_WITH_VALIDATOR, VERSION_PERSONAL_MESSAGE, VERSION_STRUCTURED_DATA, } from "./constants.js";
import { InvalidSignedDataVersionError } from "./errors.js";
/**
 * Create EIP-191 signed data from components
 *
 * Format: 0x19 <version byte> <version specific data>
 *
 * Version 0x00: 0x19 0x00 <validator address (20 bytes)> <data>
 * Version 0x01: 0x19 0x01 <domainSeparator (32 bytes)> <data>
 * Version 0x45: 0x19 0x45 <ascii "thereum Signed Message:\n" + len> <data>
 *
 * @param {number} version - Version byte (0x00, 0x01, or 0x45)
 * @param {Uint8Array} versionData - Version-specific data (validator address or domain separator)
 * @param {Uint8Array} data - Message data
 * @returns {import('./SignedDataType.js').SignedDataType} EIP-191 formatted signed data
 * @throws {InvalidSignedDataVersionError} If version is not valid
 *
 * @example
 * ```javascript
 * import { from } from './primitives/SignedData/from.js';
 *
 * // Personal message (0x45)
 * const signedData = from(0x45, new Uint8Array(), message);
 *
 * // Data with validator (0x00)
 * const signedData = from(0x00, validatorAddress, data);
 * ```
 */
export function from(version, versionData, data) {
    // Validate version
    if (version !== VERSION_DATA_WITH_VALIDATOR &&
        version !== VERSION_STRUCTURED_DATA &&
        version !== VERSION_PERSONAL_MESSAGE) {
        throw new InvalidSignedDataVersionError(`Invalid EIP-191 version: 0x${version.toString(16)}. Expected 0x00, 0x01, or 0x45`, { version });
    }
    // Calculate total length
    const totalLength = 2 + versionData.length + data.length;
    const result = new Uint8Array(totalLength);
    // Set prefix and version
    result[0] = EIP191_PREFIX;
    result[1] = version;
    // Copy version-specific data and message
    result.set(versionData, 2);
    result.set(data, 2 + versionData.length);
    return /** @type {import('./SignedDataType.js').SignedDataType} */ (result);
}
