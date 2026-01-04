import * as BrandedAddress from "../Address/internal-index.js";
import * as Hex from "../Hex/index.js";
import { encodeType } from "./encodeType.js";
import { InvalidDomainTypeError, InvalidEIP712ValueError } from "./errors.js";

/**
 * @typedef {{ readonly name: string; readonly type: string }} EIP712Field
 * @typedef {Record<string, readonly EIP712Field[]>} EIP712Types
 */

/**
 * Encode EIP-712 value according to type
 *
 * @param {string} type - Field type
 * @param {any} value - Field value
 * @param {EIP712Types} types - Type definitions
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {Uint8Array} Encoded value (32 bytes)
 * @throws {InvalidEIP712ValueError} If value encoding fails
 * @throws {InvalidDomainTypeError} If type is not found
 */
export function encodeValue(type, value, types, crypto) {
	// Handle string/bytes specially (need to hash)
	if (type === "string" || type === "bytes") {
		return encodeStringOrBytes(type, value, crypto);
	}

	// Handle array types - both dynamic (uint256[]) and fixed-size (uint256[3])
	const arrayMatch = type.match(/^(.+)\[(\d*)\]$/);
	if (arrayMatch) {
		const baseType = /** @type {string} */ (arrayMatch[1]);
		if (!Array.isArray(value)) {
			throw new InvalidEIP712ValueError(`Expected array for type ${type}`, {
				value,
				expected: "array",
				type,
			});
		}
		// Array encoding: keccak256(encodeValue(elem1) || encodeValue(elem2) || ...)
		const encodedElements = value.map((elem) =>
			encodeValue(baseType, elem, types, crypto),
		);
		const totalLength = encodedElements.reduce((sum, e) => sum + e.length, 0);
		const concatenated = new Uint8Array(totalLength);
		let offset = 0;
		for (const elem of encodedElements) {
			concatenated.set(elem, offset);
			offset += elem.length;
		}
		return crypto.keccak256(concatenated);
	}

	// Handle custom struct types
	if (type in types) {
		// Struct encoding: keccak256(encodeData(type, value, types))
		// Inline the encodeData logic to avoid circular dependency
		const typeFields = /** @type {EIP712Field[]} */ (types[type]);
		if (!typeFields) {
			throw new InvalidDomainTypeError(type, { value: types });
		}

		// Compute typeHash
		const typeString = encodeType(type, types);
		const typeHash = crypto.keccak256(new TextEncoder().encode(typeString));

		// Encode all field values recursively
		const encodedFields = [];
		for (const field of typeFields) {
			const fieldValue = value[field.name];
			const encodedValue = encodeValue(field.type, fieldValue, types, crypto);
			encodedFields.push(encodedValue);
		}

		// Concatenate: typeHash || encodedField1 || encodedField2 || ...
		const totalLength =
			32 + encodedFields.reduce((sum, f) => sum + f.length, 0);
		const encoded = new Uint8Array(totalLength);
		encoded.set(typeHash, 0);
		let offset = 32;
		for (const field of encodedFields) {
			encoded.set(field, offset);
			offset += field.length;
		}

		return crypto.keccak256(encoded);
	}

	// Handle atomic types
	return encodeAtomicValue(type, value);
}

/**
 * Encode atomic EIP-712 value
 *
 * @param {string} type - Field type
 * @param {any} value - Field value
 * @returns {Uint8Array} Encoded value (32 bytes)
 * @throws {InvalidEIP712ValueError} If type is invalid or unknown
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: EIP-712 atomic type encoding requires handling many primitive types
function encodeAtomicValue(type, value) {
	const result = new Uint8Array(32);

	// Address: left-pad to 32 bytes
	if (type === "address") {
		const addr = typeof value === "string" ? BrandedAddress.from(value) : value;
		result.set(addr, 12); // Left-pad with 12 zeros
		return result;
	}

	// Bool: 0x00...00 or 0x00...01
	if (type === "bool") {
		result[31] = value ? 1 : 0;
		return result;
	}

	// Bytes1-32: right-pad to 32 bytes
	const bytesMatch = type.match(/^bytes(\d+)$/);
	if (bytesMatch) {
		const size = Number.parseInt(/** @type {string} */ (bytesMatch[1]), 10);
		if (size < 1 || size > 32) {
			throw new InvalidEIP712ValueError(`Invalid bytes size: ${size}`, {
				value: size,
				expected: "1-32",
				type,
			});
		}
		const bytes = value instanceof Uint8Array ? value : Hex.toBytes(value);
		result.set(bytes.slice(0, size), 0);
		return result;
	}

	// Uint8-256: left-pad to 32 bytes
	const uintMatch = type.match(/^uint(\d+)$/);
	if (uintMatch) {
		const bits = Number.parseInt(/** @type {string} */ (uintMatch[1]), 10);
		if (bits < 8 || bits > 256 || bits % 8 !== 0) {
			throw new InvalidEIP712ValueError(`Invalid uint size: ${bits}`, {
				value: bits,
				expected: "8-256, multiple of 8",
				type,
			});
		}
		const num = typeof value === "bigint" ? value : BigInt(value);
		// Write bigint to bytes (big-endian)
		for (let i = 31; i >= 0; i--) {
			result[i] = Number(num >> BigInt((31 - i) * 8)) & 0xff;
		}
		return result;
	}

	// Int8-256: left-pad to 32 bytes (two's complement)
	const intMatch = type.match(/^int(\d+)$/);
	if (intMatch) {
		const bits = Number.parseInt(/** @type {string} */ (intMatch[1]), 10);
		if (bits < 8 || bits > 256 || bits % 8 !== 0) {
			throw new InvalidEIP712ValueError(`Invalid int size: ${bits}`, {
				value: bits,
				expected: "8-256, multiple of 8",
				type,
			});
		}
		let num = typeof value === "bigint" ? value : BigInt(value);
		// Handle negative numbers (two's complement)
		if (num < 0n) {
			num = (1n << 256n) + num;
		}
		// Write bigint to bytes (big-endian)
		for (let i = 31; i >= 0; i--) {
			result[i] = Number(num >> BigInt((31 - i) * 8)) & 0xff;
		}
		return result;
	}

	throw new InvalidEIP712ValueError(`Unknown type: ${type}`, {
		value: type,
		expected: "address, bool, bytes, bytesN, uintN, intN, or custom type",
		type,
	});
}

/**
 * Encode string or dynamic bytes value
 *
 * @param {string} type - Field type (string or bytes)
 * @param {any} value - Field value
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {Uint8Array} Encoded value (32 bytes)
 * @throws {InvalidEIP712ValueError} If type is not string or bytes
 */
export function encodeStringOrBytes(type, value, crypto) {
	if (type === "string") {
		return crypto.keccak256(new TextEncoder().encode(value));
	}
	if (type === "bytes") {
		const bytes = value instanceof Uint8Array ? value : Hex.toBytes(value);
		return crypto.keccak256(bytes);
	}
	throw new InvalidEIP712ValueError(`Not a string or bytes type: ${type}`, {
		value: type,
		expected: "string or bytes",
		type,
	});
}
