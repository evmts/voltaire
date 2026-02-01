/**
 * Convert Uint8Array to hex string with 0x prefix
 */
export declare function toHexPolyfill(this: Uint8Array): string;
/**
 * Set Uint8Array from hex string (with or without 0x prefix)
 * @throws {InvalidHexFormatError} If hex string has odd length
 * @throws {InvalidAddressLengthError} If hex data exceeds output array
 * @throws {InvalidHexStringError} If hex string contains invalid characters
 */
export declare function setFromHexPolyfill(this: Uint8Array, hex: string): void;
/**
 * Convert Uint8Array to base64 string
 */
export declare function toBase64Polyfill(this: Uint8Array): string;
/**
 * Set Uint8Array from base64 string
 * @throws {InvalidHexFormatError} If base64 string format is invalid
 * @throws {InvalidAddressLengthError} If decoded data exceeds output array
 */
export declare function setFromBase64Polyfill(this: Uint8Array, b64: string): void;
//# sourceMappingURL=polyfills.d.ts.map