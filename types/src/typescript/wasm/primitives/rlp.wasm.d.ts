/**
 * WASM implementation of RLP (Recursive Length Prefix) encoding
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * Encode bytes as RLP
 * @param data - Data to encode
 * @returns RLP-encoded bytes
 */
export declare function encodeBytes(data: Uint8Array): Uint8Array;
/**
 * Encode unsigned integer (u256) as RLP
 * @param value - 32-byte big-endian u256 value
 * @returns RLP-encoded bytes
 */
export declare function encodeUint(value: Uint8Array): Uint8Array;
/**
 * Encode unsigned integer from bigint
 * @param value - BigInt value
 * @returns RLP-encoded bytes
 */
export declare function encodeUintFromBigInt(value: bigint): Uint8Array;
/**
 * Convert RLP bytes to hex string
 * @param rlpData - RLP-encoded data
 * @returns Hex string with 0x prefix
 */
export declare function toHex(rlpData: Uint8Array): string;
/**
 * Convert hex string to RLP bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns RLP bytes
 */
export declare function fromHex(hex: string): Uint8Array;
declare const _default: {
    encodeBytes: typeof encodeBytes;
    encodeUint: typeof encodeUint;
    encodeUintFromBigInt: typeof encodeUintFromBigInt;
    toHex: typeof toHex;
    fromHex: typeof fromHex;
};
export default _default;
//# sourceMappingURL=rlp.wasm.d.ts.map