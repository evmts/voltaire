/**
 * Assert that value is a valid address, optionally with strict checksum validation
 *
 * @param {string | Uint8Array} value - Value to validate
 * @param {{ strict?: boolean, keccak256?: (data: Uint8Array) => Uint8Array }} [options] - Options
 * @returns {import('./AddressType.js').AddressType} The validated address as bytes
 * @throws {InvalidAddressError} If address format is invalid
 * @throws {InvalidChecksumError} If strict mode and checksum is invalid
 *
 * @example
 * ```typescript
 * // Basic validation (format only)
 * Address.assert("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 *
 * // Strict validation (requires valid checksum for mixed-case)
 * Address.assert("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", {
 *   strict: true,
 *   keccak256: hash
 * });
 *
 * // All lowercase/uppercase passes strict mode
 * Address.assert("0x742d35cc6634c0532925a3b844bc9e7595f251e3", { strict: true });
 * ```
 */
export function assert(value: string | Uint8Array, options?: {
    strict?: boolean;
    keccak256?: (data: Uint8Array) => Uint8Array;
}): import("./AddressType.js").AddressType;
/**
 * Factory: Create assert function with keccak256 injected
 *
 * @param {{ keccak256: (data: Uint8Array) => Uint8Array }} deps - Crypto dependencies
 * @returns {(value: string | Uint8Array, options?: { strict?: boolean }) => import('./AddressType.js').AddressType}
 */
export function Assert({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (value: string | Uint8Array, options?: {
    strict?: boolean;
}) => import("./AddressType.js").AddressType;
//# sourceMappingURL=assert.d.ts.map