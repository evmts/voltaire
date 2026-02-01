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
export function assertSize(data: Uint8Array | string, expectedSize: number, name?: string): void;
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
export function assertMaxSize(data: Uint8Array | string, maxSize: number, name?: string): void;
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
export function assertMinSize(data: Uint8Array | string, minSize: number, name?: string): void;
//# sourceMappingURL=assertSize.d.ts.map