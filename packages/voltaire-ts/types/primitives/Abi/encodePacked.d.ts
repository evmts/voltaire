/**
 * ABI encodePacked - compact encoding without padding
 * Used for hash computations where standard ABI encoding would waste space
 *
 * @param {readonly string[]} types - Array of type strings
 * @param {readonly unknown[]} values - Array of values to encode
 * @returns {import("../Hex/index.js").HexType} Encoded data (hex string)
 * @throws {AbiParameterMismatchError} If types and values length mismatch
 * @throws {AbiEncodingError} If encoding fails or unsupported type
 *
 * @example
 * ```typescript
 * // Standard use case: creating signature hashes
 * const encoded = Abi.encodePacked(
 *   ["address", "uint256"],
 *   ["0x742d35cc6634c0532925a3b844bc9e7595f251e3", 100n]
 * );
 * // No padding - address is 20 bytes, uint256 is 32 bytes (but only uses needed bytes)
 * ```
 */
export function encodePacked(types: readonly string[], values: readonly unknown[]): import("../Hex/index.js").HexType;
//# sourceMappingURL=encodePacked.d.ts.map