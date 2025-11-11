import { keccak_256 } from "@noble/hashes/sha3.js";
import { Eip712EncodingError } from "./errors.js";
import { hashStruct } from "./hashStruct.js";

/**
 * Encode single value to 32 bytes according to EIP-712.
 *
 * Handles primitive types, arrays, strings, bytes, and custom structs.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} type - Solidity type string (e.g., 'uint256', 'address', 'string', 'bytes32', custom type)
 * @param {import('./BrandedEIP712.js').MessageValue} value - Value to encode
 * @param {import('./BrandedEIP712.js').TypeDefinitions} types - Type definitions for custom types
 * @returns {Uint8Array} 32-byte encoded value (or hash for dynamic types)
 * @throws {Eip712EncodingError} If type is unsupported or value format is invalid
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * const encoded = EIP712.encodeValue('uint256', 42n, types);
 * ```
 */
export function encodeValue(type, value, types) {
	const result = new Uint8Array(32);

	// array types (hash the array encoding) - CHECK BEFORE uint/int to avoid matching "uint256[]"
	if (type.endsWith("[]")) {
		const baseType = type.slice(0, -2);
		const arr = /** @type {import('./BrandedEIP712.js').MessageValue[]} */ (
			value
		);
		/** @type {Uint8Array[]} */
		const encodedElements = [];
		for (const elem of arr) {
			encodedElements.push(encodeValue(baseType, elem, types));
		}
		// Concatenate all encoded elements and hash
		const totalLength = encodedElements.reduce((sum, e) => sum + e.length, 0);
		const concatenated = new Uint8Array(totalLength);
		let offset = 0;
		for (const elem of encodedElements) {
			concatenated.set(elem, offset);
			offset += elem.length;
		}
		const hash = keccak_256(concatenated);
		return hash;
	}

	// uint/int types
	if (type.startsWith("uint") || type.startsWith("int")) {
		let num;
		if (typeof value === "bigint") {
			num = value;
		} else if (typeof value === "number") {
			num = BigInt(value);
		} else if (typeof value === "string") {
			num = BigInt(value);
		} else {
			throw new Eip712EncodingError(
				`Cannot encode value of type ${typeof value} as ${type}`,
			);
		}
		// Big-endian encoding
		let v = num;
		for (let i = 31; i >= 0; i--) {
			result[i] = Number(v & 0xffn);
			v >>= 8n;
		}
		return result;
	}

	// address type
	if (type === "address") {
		const addr = /** @type {Uint8Array} */ (value);
		if (addr.length !== 20) {
			throw new Eip712EncodingError("Address must be 20 bytes");
		}
		result.set(addr, 12); // Right-aligned in 32 bytes
		return result;
	}

	// bool type
	if (type === "bool") {
		result[31] = value ? 1 : 0;
		return result;
	}

	// string type (hash)
	if (type === "string") {
		const str = /** @type {string} */ (value);
		const encoded = new TextEncoder().encode(str);
		const hash = keccak_256(encoded);
		return hash;
	}

	// bytes type (dynamic - hash)
	if (type === "bytes") {
		const bytes = /** @type {Uint8Array} */ (value);
		const hash = keccak_256(bytes);
		return hash;
	}

	// bytesN type (fixed)
	if (type.startsWith("bytes")) {
		const match = type.match(/^bytes(\d+)$/);
		if (match?.[1]) {
			const size = Number.parseInt(match[1], 10);
			const bytes = /** @type {Uint8Array} */ (value);
			if (bytes.length !== size) {
				throw new Eip712EncodingError(
					`${type} must be ${size} bytes, got ${bytes.length}`,
				);
			}
			result.set(bytes, 0); // Left-aligned
			return result;
		}
	}

	// Custom struct type (hash the struct)
	if (types[type]) {
		const obj = /** @type {import('./BrandedEIP712.js').Message} */ (value);
		const hash = hashStruct(type, obj, types);
		return hash;
	}

	throw new Eip712EncodingError(`Unsupported type: ${type}`);
}
