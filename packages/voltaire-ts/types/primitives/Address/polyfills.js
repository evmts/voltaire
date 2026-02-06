/**
 * Polyfills for Uint8Array methods that may not be available in all environments
 */
import * as Base64 from "../Base64/index.js";
import { InvalidAddressLengthError, InvalidHexFormatError, InvalidHexStringError, } from "./errors.js";
/**
 * Convert Uint8Array to hex string with 0x prefix
 */
export function toHexPolyfill() {
    let hex = "0x";
    for (let i = 0; i < this.length; i++) {
        hex += this[i]?.toString(16).padStart(2, "0");
    }
    return hex;
}
/**
 * Set Uint8Array from hex string (with or without 0x prefix)
 * @throws {InvalidHexFormatError} If hex string has odd length
 * @throws {InvalidAddressLengthError} If hex data exceeds output array
 * @throws {InvalidHexStringError} If hex string contains invalid characters
 */
export function setFromHexPolyfill(hex) {
    const str = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (str.length % 2 !== 0) {
        throw new InvalidHexFormatError("Invalid hex string length", {
            value: hex,
            expected: "Even-length hex string",
        });
    }
    if (str.length / 2 > this.length) {
        throw new InvalidAddressLengthError("Output array too small", {
            value: str.length / 2,
            expected: `${this.length} bytes or less`,
        });
    }
    for (let i = 0; i < str.length; i += 2) {
        const byte = Number.parseInt(str.slice(i, i + 2), 16);
        if (Number.isNaN(byte)) {
            throw new InvalidHexStringError("Invalid hex character", {
                value: str.slice(i, i + 2),
                expected: "Valid hexadecimal characters (0-9, a-f, A-F)",
                context: { position: i },
            });
        }
        this[i / 2] = byte;
    }
}
/**
 * Convert Uint8Array to base64 string
 */
export function toBase64Polyfill() {
    return Base64.encode(this);
}
/**
 * Set Uint8Array from base64 string
 * @throws {InvalidHexFormatError} If base64 string format is invalid
 * @throws {InvalidAddressLengthError} If decoded data exceeds output array
 */
export function setFromBase64Polyfill(b64) {
    // Validate base64 string
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) {
        throw new InvalidHexFormatError("Invalid base64 string", {
            value: b64,
            expected: "Valid base64 string (A-Za-z0-9+/=)",
        });
    }
    let decoded;
    try {
        decoded = Base64.decode(b64);
    }
    catch (_e) {
        throw new InvalidHexFormatError("Invalid base64 string", {
            value: b64,
            expected: "Valid base64 string",
        });
    }
    if (decoded.length > this.length) {
        throw new InvalidAddressLengthError("Output array too small", {
            value: decoded.length,
            expected: `${this.length} bytes or less`,
        });
    }
    this.set(decoded);
}
