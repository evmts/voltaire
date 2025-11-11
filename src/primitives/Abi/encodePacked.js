// @ts-nocheck
import { Address } from "../Address/index.js";
import * as Hex from "../Hex/index.js";
import { AbiEncodingError, AbiParameterMismatchError } from "./Errors.js";

/**
 * ABI encodePacked - compact encoding without padding
 * Used for hash computations where standard ABI encoding would waste space
 *
 * @param {readonly string[]} types - Array of type strings
 * @param {readonly unknown[]} values - Array of values to encode
 * @returns {import("../Hex/BrandedHex/BrandedHex.js").BrandedHex} Encoded data (hex string)
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
export function encodePacked(types, values) {
	if (types.length !== values.length) {
		throw new AbiParameterMismatchError(
			`Type/value count mismatch: ${types.length} types, ${values.length} values`,
			{
				value: values.length,
				expected: `${types.length} values`,
				context: { types, values }
			}
		);
	}

	const parts = [];

	for (let i = 0; i < types.length; i++) {
		const type = types[i];
		const value = values[i];

		if (!type) continue;

		parts.push(encodePackedValue(type, value));
	}

	// Concatenate all parts
	const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}

	return Hex.fromBytes(result);
}

/**
 * Encode a single value in packed format
 *
 * @param {string} type - Solidity type
 * @param {unknown} value - Value to encode
 * @returns {Uint8Array} Encoded bytes (no padding)
 */
function encodePackedValue(type, value) {
	// Arrays - check this FIRST before other type checks
	// because "uint256[]" starts with "uint" but should be handled as array
	if (type.endsWith("[]")) {
		const elementType = type.slice(0, -2);
		const array = /** @type {unknown[]} */ (value);
		const parts = [];
		for (const item of array) {
			parts.push(encodePackedValue(elementType, item));
		}
		const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
		const result = new Uint8Array(totalLength);
		let offset = 0;
		for (const part of parts) {
			result.set(part, offset);
			offset += part.length;
		}
		return result;
	}

	// Fixed arrays - also check early
	const fixedArrayMatch = type.match(/^(.+)\[(\d+)\]$/);
	if (fixedArrayMatch) {
		const elementType = fixedArrayMatch[1];
		const length = Number.parseInt(fixedArrayMatch[2]);
		const array = /** @type {unknown[]} */ (value);
		if (array.length !== length) {
			throw new AbiEncodingError(
				`Invalid ${type} length: expected ${length}, got ${array.length}`,
				{
					context: { type, expectedLength: length, actualLength: array.length, value: array }
				}
			);
		}
		const parts = [];
		for (const item of array) {
			parts.push(encodePackedValue(elementType, item));
		}
		const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
		const result = new Uint8Array(totalLength);
		let offset = 0;
		for (const part of parts) {
			result.set(part, offset);
			offset += part.length;
		}
		return result;
	}

	// Address - 20 bytes, no padding
	if (type === "address") {
		const addr = typeof value === "string" ? Address.fromHex(value) : value;
		return /** @type {Uint8Array} */ (addr);
	}

	// Bool - 1 byte
	if (type === "bool") {
		return new Uint8Array([value ? 1 : 0]);
	}

	// String - UTF-8 bytes, no length prefix
	if (type === "string") {
		return new TextEncoder().encode(/** @type {string} */ (value));
	}

	// Bytes - raw bytes, no length prefix
	if (type === "bytes") {
		if (typeof value === "string") {
			return Hex.toBytes(value);
		}
		return /** @type {Uint8Array} */ (value);
	}

	// Fixed bytes (bytes1-bytes32) - no padding
	if (type.startsWith("bytes")) {
		const size = Number.parseInt(type.slice(5));
		if (size >= 1 && size <= 32) {
			const bytes =
				typeof value === "string"
					? Hex.toBytes(value)
					: /** @type {Uint8Array} */ (value);
			if (bytes.length !== size) {
				throw new AbiEncodingError(
					`Invalid ${type} length: expected ${size}, got ${bytes.length}`,
					{
						context: { type, expectedSize: size, actualSize: bytes.length }
					}
				);
			}
			return bytes;
		}
	}

	// Uint - minimal bytes needed
	if (type.startsWith("uint")) {
		const bits = type === "uint" ? 256 : Number.parseInt(type.slice(4));
		const bytes = bits / 8;
		let bigintValue;
		if (typeof value === "number") {
			bigintValue = BigInt(value);
		} else if (typeof value === "bigint") {
			bigintValue = value;
		} else {
			// Convert string or other types to BigInt
			bigintValue = BigInt(value);
		}

		// Convert to bytes (big-endian)
		const result = new Uint8Array(bytes);
		let v = bigintValue;
		for (let i = bytes - 1; i >= 0; i--) {
			result[i] = Number(v & 0xffn);
			v >>= 8n;
		}
		return result;
	}

	// Int - minimal bytes needed (two's complement)
	if (type.startsWith("int")) {
		const bits = type === "int" ? 256 : Number.parseInt(type.slice(3));
		const bytes = bits / 8;
		let bigintValue;
		if (typeof value === "number") {
			bigintValue = BigInt(value);
		} else if (typeof value === "bigint") {
			bigintValue = value;
		} else {
			// Convert string or other types to BigInt
			bigintValue = BigInt(value);
		}

		// Convert to two's complement if negative
		const unsigned =
			bigintValue < 0n ? (1n << BigInt(bits)) + bigintValue : bigintValue;

		// Convert to bytes (big-endian)
		const result = new Uint8Array(bytes);
		let v = unsigned;
		for (let i = bytes - 1; i >= 0; i--) {
			result[i] = Number(v & 0xffn);
			v >>= 8n;
		}
		return result;
	}

	throw new AbiEncodingError(`Unsupported packed type: ${type}`, {
		context: { type, value }
	});
}
