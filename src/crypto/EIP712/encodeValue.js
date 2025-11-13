import { Eip712EncodingError } from "./errors.js";

/**
 * Factory: Encode single value to 32 bytes according to EIP-712.
 *
 * Handles primitive types, arrays, strings, bytes, and custom structs.
 * Addresses must be pre-validated BrandedAddress types.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(type: string, data: import('./BrandedEIP712.js').Message, types: import('./BrandedEIP712.js').TypeDefinitions) => import('../../primitives/Hash/index.js').BrandedHash} deps.hashStruct - Hash struct function
 * @returns {(type: string, value: import('./BrandedEIP712.js').MessageValue, types: import('./BrandedEIP712.js').TypeDefinitions) => Uint8Array} Function that encodes value
 * @throws {Eip712EncodingError} If type is unsupported or value format is invalid
 * @example
 * ```javascript
 * import { EncodeValue } from './crypto/EIP712/encodeValue.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * import { HashStruct } from './hashStruct.js';
 * const hashStruct = HashStruct({ keccak256, encodeData });
 * const encodeValue = EncodeValue({ keccak256, hashStruct });
 * const encoded = encodeValue('uint256', 42n, types);
 * ```
 */
export function EncodeValue({ keccak256, hashStruct }) {
	return function encodeValue(type, value, types) {
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
			const hash = keccak256(concatenated);
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
					{
						code: "EIP712_INVALID_VALUE_TYPE",
						context: { type, valueType: typeof value, value },
						docsPath: "/crypto/eip712/encode-value#error-handling",
					},
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

		// address type (must be BrandedAddress - already validated as 20 bytes)
		if (type === "address") {
			const addr =
				/** @type {import('../../primitives/Address/BrandedAddress/BrandedAddress.js').BrandedAddress} */ (
					value
				);
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
			const hash = keccak256(encoded);
			return hash;
		}

		// bytes type (dynamic - hash)
		if (type === "bytes") {
			const bytes = /** @type {Uint8Array} */ (value);
			const hash = keccak256(bytes);
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
						{
							code: "EIP712_INVALID_BYTES_LENGTH",
							context: { type, length: bytes.length, expected: size },
							docsPath: "/crypto/eip712/encode-value#error-handling",
						},
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

		throw new Eip712EncodingError(`Unsupported type: ${type}`, {
			code: "EIP712_UNSUPPORTED_TYPE",
			context: { type, availableTypes: Object.keys(types) },
			docsPath: "/crypto/eip712/encode-value#error-handling",
		});
	};
}
