import { InvalidSizeError } from "../errors/index.js";
/**
 * Assert data has exact size in bytes
 *
 * @param {Uint8Array | string} data - Data to check (Uint8Array or hex string)
 * @param {number} expectedSize - Expected size in bytes
 * @param {string} [name='data'] - Name for error messages
 * @throws {InvalidSizeError} If size doesn't match
 * @example
 * ```javascript
 * assertSize(addressBytes, 20, 'address');     // OK for 20 bytes
 * assertSize('0x1234', 2, 'hex');               // OK (2 bytes)
 * assertSize('0x123456', 2, 'hex');             // throws InvalidSizeError
 * ```
 */
export function assertSize(data, expectedSize, name = "data") {
    const actualSize = getSize(data);
    if (actualSize !== expectedSize) {
        throw new InvalidSizeError(`${name} must be ${expectedSize} bytes, got ${actualSize}`, {
            value: data,
            actualSize,
            expectedSize,
        });
    }
}
/**
 * Assert data does not exceed maximum size
 *
 * @param {Uint8Array | string} data - Data to check
 * @param {number} maxSize - Maximum allowed size in bytes
 * @param {string} [name='data'] - Name for error messages
 * @throws {InvalidSizeError} If size > maxSize
 * @example
 * ```javascript
 * assertMaxSize(calldata, 24576, 'calldata'); // Max contract size
 * ```
 */
export function assertMaxSize(data, maxSize, name = "data") {
    const actualSize = getSize(data);
    if (actualSize > maxSize) {
        throw new InvalidSizeError(`${name} exceeds maximum ${maxSize} bytes, got ${actualSize}`, {
            value: data,
            actualSize,
            expectedSize: maxSize,
            context: { constraint: "max" },
        });
    }
}
/**
 * Assert data meets minimum size
 *
 * @param {Uint8Array | string} data - Data to check
 * @param {number} minSize - Minimum required size in bytes
 * @param {string} [name='data'] - Name for error messages
 * @throws {InvalidSizeError} If size < minSize
 * @example
 * ```javascript
 * assertMinSize(signature, 64, 'signature'); // At least 64 bytes
 * ```
 */
export function assertMinSize(data, minSize, name = "data") {
    const actualSize = getSize(data);
    if (actualSize < minSize) {
        throw new InvalidSizeError(`${name} must be at least ${minSize} bytes, got ${actualSize}`, {
            value: data,
            actualSize,
            expectedSize: minSize,
            context: { constraint: "min" },
        });
    }
}
/**
 * Get byte size of data
 *
 * @param {Uint8Array | string} data - Data (Uint8Array or hex string)
 * @returns {number} Size in bytes
 */
function getSize(data) {
    if (data instanceof Uint8Array) {
        return data.length;
    }
    // Hex string: subtract '0x' prefix and divide by 2
    if (typeof data === "string") {
        const hex = data.startsWith("0x") ? data.slice(2) : data;
        return Math.floor(hex.length / 2);
    }
    return 0;
}
