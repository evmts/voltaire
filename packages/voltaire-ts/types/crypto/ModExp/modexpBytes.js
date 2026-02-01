import { modexp } from "./compute.js";
/**
 * Modular exponentiation with byte array inputs/outputs
 *
 * Computes base^exp mod modulus where inputs are big-endian byte arrays.
 * Output is padded to modulus length per EIP-198 spec.
 *
 * @see https://eips.ethereum.org/EIPS/eip-198
 * @since 0.0.0
 * @param {Uint8Array} baseBytes - Base as big-endian bytes
 * @param {Uint8Array} expBytes - Exponent as big-endian bytes
 * @param {Uint8Array} modBytes - Modulus as big-endian bytes
 * @returns {Uint8Array} Result as big-endian bytes, padded to modulus length
 * @throws {Error} If modulus is zero
 * @example
 * ```javascript
 * import { ModExp } from './crypto/ModExp/index.js';
 *
 * const base = new Uint8Array([0x02]); // 2
 * const exp = new Uint8Array([0x03]);  // 3
 * const mod = new Uint8Array([0x05]);  // 5
 *
 * const result = ModExp.modexpBytes(base, exp, mod);
 * console.log(result); // Uint8Array([0x03]) = 3
 * ```
 */
export function modexpBytes(baseBytes, expBytes, modBytes) {
    const base = bytesToBigInt(baseBytes);
    const exp = bytesToBigInt(expBytes);
    const mod = bytesToBigInt(modBytes);
    if (mod === 0n) {
        throw new Error("Division by zero: modulus cannot be zero");
    }
    const result = modexp(base, exp, mod);
    // Output size matches modulus byte length per EIP-198
    return bigIntToBytes(result, modBytes.length);
}
/**
 * Convert big-endian bytes to BigInt
 * @param {Uint8Array} bytes
 * @returns {bigint}
 */
function bytesToBigInt(bytes) {
    if (bytes.length === 0)
        return 0n;
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
        result = (result << 8n) | BigInt(bytes[i] ?? 0);
    }
    return result;
}
/**
 * Convert BigInt to big-endian bytes with specified size
 * @param {bigint} value
 * @param {number} size
 * @returns {Uint8Array}
 */
function bigIntToBytes(value, size) {
    const out = new Uint8Array(size);
    let v = value;
    for (let i = size - 1; i >= 0; i--) {
        out[i] = Number(v & 0xffn);
        v >>= 8n;
    }
    return out;
}
