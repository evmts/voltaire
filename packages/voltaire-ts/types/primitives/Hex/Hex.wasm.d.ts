/**
 * WASM implementation of hex utilities
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * Convert hex string to bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Raw bytes
 * @throws {InvalidFormatError} If hex string is missing 0x prefix
 * @throws {InvalidCharacterError} If hex string contains invalid characters
 * @throws {OddLengthError} If hex string has odd length
 */
export declare function hexToBytes(hex: string): Uint8Array;
/**
 * Convert bytes to hex string
 * @param data - Raw bytes
 * @returns Hex string with 0x prefix
 */
export declare function bytesToHex(data: Uint8Array): string;
declare const _default: {
    hexToBytes: typeof hexToBytes;
    bytesToHex: typeof bytesToHex;
};
export default _default;
//# sourceMappingURL=Hex.wasm.d.ts.map