/**
 * WASM implementation of U256 operations
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * Convert hex string to U256 (32-byte big-endian)
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 32-byte U256 value
 */
export declare function u256FromHex(hex: string): Uint8Array;
/**
 * Convert U256 to hex string
 * @param value - 32-byte U256 value (big-endian)
 * @returns Hex string with 0x prefix
 */
export declare function u256ToHex(value: Uint8Array): string;
/**
 * Convert bigint to U256 bytes
 * @param value - BigInt value
 * @returns 32-byte U256 value
 */
export declare function u256FromBigInt(value: bigint): Uint8Array;
/**
 * Convert U256 bytes to bigint
 * @param value - 32-byte U256 value
 * @returns BigInt value
 */
export declare function u256ToBigInt(value: Uint8Array): bigint;
declare const _default: {
    u256FromHex: typeof u256FromHex;
    u256ToHex: typeof u256ToHex;
    u256FromBigInt: typeof u256FromBigInt;
    u256ToBigInt: typeof u256ToBigInt;
};
export default _default;
//# sourceMappingURL=uint256.wasm.d.ts.map