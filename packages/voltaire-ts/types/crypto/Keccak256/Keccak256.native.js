/**
 * Keccak256 native implementation using FFI
 * Auto-detects Bun FFI or Node-API
 */
import { allocateOutput, checkError, loadNative, } from "../../native-loader/index.js";
import * as Hex from "../../primitives/Hex/index.js";
import { Keccak256NativeNotLoadedError } from "./errors.js";
// Lazy-load native library
let nativeLib = null;
async function ensureLoaded() {
    if (!nativeLib) {
        nativeLib = await loadNative();
    }
    return nativeLib;
}
/**
 * Hash data with Keccak-256 using native implementation
 *
 * @param data - Data to hash
 * @returns 32-byte hash
 * @throws {Keccak256Error} If native operation fails
 */
export async function hash(data) {
    const lib = await ensureLoaded();
    const output = allocateOutput(32);
    const result = lib.primitives_keccak256(data, data.length, output);
    checkError(result, "keccak256");
    return output;
}
/**
 * Hash hex string with Keccak-256 using native implementation
 *
 * @param hex - Hex string to hash
 * @returns 32-byte hash
 * @throws {Keccak256Error} If native operation fails
 */
export async function hashHex(hex) {
    const bytes = Hex.toBytes(hex);
    return hash(bytes);
}
/**
 * Hash UTF-8 string with Keccak-256 using native implementation
 *
 * @param str - String to hash
 * @returns 32-byte hash
 * @throws {Keccak256Error} If native operation fails
 */
export async function hashString(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    return hash(bytes);
}
/**
 * Universal constructor - accepts hex, string, or bytes
 *
 * @param input - Hex string, UTF-8 string, or Uint8Array
 * @returns 32-byte hash
 * @throws {Keccak256Error} If native operation fails
 */
export async function from(input) {
    if (typeof input === "string") {
        // Check if hex string
        if (input.startsWith("0x")) {
            return hashHex(input);
        }
        return hashString(input);
    }
    return hash(input);
}
/**
 * Compute function selector (first 4 bytes of keccak256)
 *
 * @param signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns First 4 bytes of hash as hex string
 */
export async function selector(signature) {
    const fullHash = await hashString(signature);
    const selectorBytes = fullHash.slice(0, 4);
    return `0x${Array.from(selectorBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;
}
/**
 * Compute event topic hash
 *
 * @param signature - Event signature (e.g., "Transfer(address,address,uint256)")
 * @returns 32-byte topic hash
 */
export async function topic(signature) {
    return hashString(signature);
}
/**
 * Synchronous hash (for backward compatibility)
 * @throws {Keccak256NativeNotLoadedError} If native library not loaded
 */
export function hashSync(data) {
    if (!nativeLib) {
        throw new Keccak256NativeNotLoadedError();
    }
    const output = allocateOutput(32);
    const result = nativeLib.primitives_keccak256(data, data.length, output);
    checkError(result, "keccak256");
    return output;
}
// Re-export constants from pure TS implementation
export { DIGEST_SIZE, RATE, STATE_SIZE } from "./constants.js";
/**
 * Native Keccak256 namespace object
 */
export const Keccak256Hash = Object.assign(from, {
    from,
    fromString: hashString,
    fromHex: hashHex,
    hash,
    hashString,
    hashHex,
    hashSync,
    selector,
    topic,
    // Constants
    DIGEST_SIZE: 32,
    RATE: 136,
    STATE_SIZE: 200,
});
export const Keccak256 = Keccak256Hash;
