/**
 * 64-bit unsigned integer utilities for BLAKE2b
 */

import { MASK_64 } from "./constants.js";

/**
 * Right rotation for 64-bit values
 * @param {bigint} x - Value to rotate
 * @param {number} n - Number of bits to rotate
 * @returns {bigint} Rotated value
 */
export function rotr64(x, n) {
	return ((x >> BigInt(n)) | (x << BigInt(64 - n))) & MASK_64;
}

/**
 * Read a little-endian 64-bit unsigned integer from bytes
 * @param {Uint8Array} data - Byte array
 * @param {number} offset - Offset in bytes
 * @returns {bigint} 64-bit value
 */
export function readU64LE(data, offset) {
	let result = 0n;
	for (let i = 0; i < 8; i++) {
		result |= BigInt(/** @type {number} */ (data[offset + i])) << BigInt(i * 8);
	}
	return result;
}

/**
 * Write a little-endian 64-bit unsigned integer to bytes
 * @param {Uint8Array} data - Byte array
 * @param {number} offset - Offset in bytes
 * @param {bigint} value - 64-bit value
 */
export function writeU64LE(data, offset, value) {
	for (let i = 0; i < 8; i++) {
		data[offset + i] = Number((value >> BigInt(i * 8)) & 0xffn);
	}
}
