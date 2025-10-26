/**
 * WASM implementation of hex utilities
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * Convert hex string to bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Raw bytes
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
//# sourceMappingURL=hex.wasm.d.ts.map