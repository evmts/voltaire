// @ts-check

/** @import { AddressType as BrandedAddress } from "../Address/AddressType.js" */
/** @import { Parameter } from "./Parameter.js" */
/** @import { ParametersToPrimitiveTypes } from "./Parameter.js" */

import { Address } from "../Address/index.js";
import * as Hex from "../Hex/index.js";
import * as Uint from "../Uint/index.js";
import {
	AbiDecodingError,
	AbiEncodingError,
	AbiParameterMismatchError,
} from "./Errors.js";

/**
 * @param {bigint} value
 * @returns {Uint8Array}
 */
function encodeUint256(value) {
	return Uint.toAbiEncoded(Uint.from(value));
}

/**
 * @param {bigint | number} value
 * @param {number} bits
 * @returns {Uint8Array}
 */
function encodeUint(value, bits) {
	const bigintValue = typeof value === "number" ? BigInt(value) : value;
	const max = (1n << BigInt(bits)) - 1n;
	if (bigintValue < 0n || bigintValue > max) {
		throw new AbiEncodingError(
			`Value ${bigintValue} out of range for uint${bits}`,
		);
	}
	return encodeUint256(bigintValue);
}

/**
 * @param {bigint | number} value
 * @param {number} bits
 * @returns {Uint8Array}
 */
function encodeInt(value, bits) {
	const bigintValue = typeof value === "number" ? BigInt(value) : value;
	const min = -(1n << (BigInt(bits) - 1n));
	const max = (1n << (BigInt(bits) - 1n)) - 1n;
	if (bigintValue < min || bigintValue > max) {
		throw new AbiEncodingError(
			`Value ${bigintValue} out of range for int${bits}`,
		);
	}
	const unsigned = bigintValue < 0n ? (1n << 256n) + bigintValue : bigintValue;
	return encodeUint256(unsigned);
}

/**
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
function padRight(data) {
	const paddedLength = Math.ceil(data.length / 32) * 32;
	if (paddedLength === data.length) return data;
	const result = new Uint8Array(paddedLength);
	result.set(data, 0);
	return result;
}

/**
 * @param {Parameter["type"]} type
 * @param {readonly Parameter[]=} components
 * @returns {boolean}
 */
function isDynamicType(type, components) {
	if (type === "string" || type === "bytes") return true;
	if (type.endsWith("[]")) return true;
	if (type === "tuple" && components) {
		return components.some((c) => isDynamicType(c.type, c.components));
	}
	if (type.includes("[") && type.endsWith("]")) {
		const match = type.match(/^(.+)\[(\d+)\]$/);
		if (match?.[1]) {
			const elementType = /** @type {Parameter["type"]} */ (match[1]);
			return isDynamicType(elementType);
		}
	}
	return false;
}

/**
 * @param {Parameter["type"]} type
 * @param {unknown} value
 * @param {readonly Parameter[]=} components
 * @returns {{ encoded: Uint8Array; isDynamic: boolean }}
 */
function encodeValue(type, value, components) {
	// Handle tuples FIRST
	if (type === "tuple" && components) {
		const tuple = /** @type {unknown[]} */ (value);
		const encoded = encodeParameters(
			/** @type {any} */ (components),
			/** @type {any} */ (tuple),
		);
		const isDynamic = isDynamicType(type, components);
		return { encoded, isDynamic };
	}

	// Check for arrays FIRST before other types
	// Dynamic arrays: uint256[], address[], etc.
	if (type.endsWith("[]")) {
		const elementType = /** @type {Parameter["type"]} */ (type.slice(0, -2));
		const array = /** @type {unknown[]} */ (value);
		const length = encodeUint256(BigInt(array.length));

		const elementParams = array.map(() => ({
			type: elementType,
			components,
		}));
		const encodedElements = encodeParameters(
			/** @type {any} */ (elementParams),
			/** @type {any} */ (array),
		);

		const result = new Uint8Array(length.length + encodedElements.length);
		result.set(length, 0);
		result.set(encodedElements, length.length);
		return { encoded: result, isDynamic: true };
	}

	// Fixed arrays: uint256[3], address[2], etc.
	// MUST check before uint/int to avoid matching "uint256[3]" as "uint"
	const fixedArrayMatch = type.match(/^(.+)\[(\d+)\]$/);
	if (fixedArrayMatch?.[1] && fixedArrayMatch[2]) {
		const elementType = /** @type {Parameter["type"]} */ (fixedArrayMatch[1]);
		const arraySize = Number.parseInt(fixedArrayMatch[2]);
		const array = /** @type {unknown[]} */ (value);

		if (array.length !== arraySize) {
			throw new AbiEncodingError(
				`Array length mismatch: expected ${arraySize}, got ${array.length}`,
			);
		}

		const elementParams = array.map(() => ({
			type: elementType,
			components,
		}));
		const encoded = encodeParameters(
			/** @type {any} */ (elementParams),
			/** @type {any} */ (array),
		);
		const isDynamic = isDynamicType(elementType, components);
		return { encoded, isDynamic };
	}

	if (type.startsWith("uint")) {
		const bits = type === "uint" ? 256 : Number.parseInt(type.slice(4));
		const encoded = encodeUint(/** @type {bigint | number} */ (value), bits);
		return { encoded, isDynamic: false };
	}

	if (type.startsWith("int")) {
		const bits = type === "int" ? 256 : Number.parseInt(type.slice(3));
		const encoded = encodeInt(/** @type {bigint | number} */ (value), bits);
		return { encoded, isDynamic: false };
	}

	if (type === "address") {
		const addr = /** @type {BrandedAddress | string} */ (value);
		if (typeof addr === "string") {
			const addressValue = Address.fromHex(addr);
			return {
				encoded: Address.toAbiEncoded(addressValue),
				isDynamic: false,
			};
		}
		return { encoded: Address.toAbiEncoded(addr), isDynamic: false };
	}

	if (type === "bool") {
		const result = new Uint8Array(32);
		result[31] = value ? 1 : 0;
		return { encoded: result, isDynamic: false };
	}

	if (type.startsWith("bytes") && type.length > 5) {
		const size = Number.parseInt(type.slice(5));
		if (size >= 1 && size <= 32) {
			let bytes;
			if (typeof value === "string") {
				bytes = Hex.toBytes(/** @type {any} */ (value));
			} else {
				bytes = /** @type {Uint8Array} */ (value);
			}
			if (bytes.length !== size) {
				throw new AbiEncodingError(
					`Invalid ${type} length: expected ${size}, got ${bytes.length}`,
				);
			}
			const result = new Uint8Array(32);
			result.set(bytes, 0);
			return { encoded: result, isDynamic: false };
		}
	}

	if (type === "bytes") {
		const bytes =
			typeof value === "string"
				? Hex.toBytes(/** @type {any} */ (value))
				: /** @type {Uint8Array} */ (value);
		const length = encodeUint256(BigInt(bytes.length));
		const data = padRight(bytes);
		const result = new Uint8Array(length.length + data.length);
		result.set(length, 0);
		result.set(data, length.length);
		return { encoded: result, isDynamic: true };
	}

	if (type === "string") {
		const str = /** @type {string} */ (value);
		const bytes = new TextEncoder().encode(str);
		const length = encodeUint256(BigInt(bytes.length));
		const data = padRight(bytes);
		const result = new Uint8Array(length.length + data.length);
		result.set(length, 0);
		result.set(data, length.length);
		return { encoded: result, isDynamic: true };
	}

	throw new AbiEncodingError(`Unsupported type: ${type}`);
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @returns {bigint}
 */
function decodeUint256(data, offset) {
	if (offset + 32 > data.length) {
		throw new AbiDecodingError("Data too small for uint256");
	}
	const slice = data.slice(offset, offset + 32);
	return Uint.toBigInt(Uint.fromAbiEncoded(slice));
}

/**
 * @param {Parameter["type"]} type
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {readonly Parameter[]=} components
 * @returns {{ value: unknown; newOffset: number }}
 */
function decodeValue(type, data, offset, components) {
	// Handle tuples
	if (type === "tuple" && components) {
		const isDynamic = isDynamicType(type, components);
		if (isDynamic) {
			const dataOffset = Number(decodeUint256(data, offset));
			const value = decodeParameters(
				/** @type {any} */ (components),
				data.slice(dataOffset),
			);
			return { value, newOffset: offset + 32 };
		}
		// Static tuple - decode inline
		const value = decodeParameters(
			/** @type {any} */ (components),
			data.slice(offset),
		);
		// Calculate static size by summing component sizes
		let staticSize = 0;
		for (const comp of components) {
			staticSize += 32; // Each component takes at least 32 bytes in static part
		}
		return { value, newOffset: offset + staticSize };
	}

	if (type.endsWith("[]")) {
		const elementType = /** @type {Parameter["type"]} */ (type.slice(0, -2));
		const dataOffset = Number(decodeUint256(data, offset));
		const length = Number(decodeUint256(data, dataOffset));

		const elementParams = Array(length).fill({
			type: elementType,
			components,
		});
		const value = decodeParameters(
			/** @type {any} */ (elementParams),
			data.slice(dataOffset + 32),
		);
		return { value, newOffset: offset + 32 };
	}

	const fixedArrayMatch = type.match(/^(.+)\[(\d+)\]$/);
	if (fixedArrayMatch?.[1] && fixedArrayMatch[2]) {
		const elementType = /** @type {Parameter["type"]} */ (fixedArrayMatch[1]);
		const arraySize = Number.parseInt(fixedArrayMatch[2]);

		const elementParams = Array(arraySize).fill({
			type: elementType,
			components,
		});
		if (isDynamicType(elementType, components)) {
			const dataOffset = Number(decodeUint256(data, offset));
			const value = decodeParameters(
				/** @type {any} */ (elementParams),
				data.slice(dataOffset),
			);
			return { value, newOffset: offset + 32 };
		}
		const value = decodeParameters(
			/** @type {any} */ (elementParams),
			data.slice(offset),
		);
		return { value, newOffset: offset + arraySize * 32 };
	}

	if (type.startsWith("uint")) {
		const bits = type === "uint" ? 256 : Number.parseInt(type.slice(4));
		const value = decodeUint256(data, offset);
		const max = (1n << BigInt(bits)) - 1n;
		if (value > max) {
			throw new AbiDecodingError(`Value ${value} out of range for ${type}`);
		}
		return { value, newOffset: offset + 32 };
	}

	if (type.startsWith("int")) {
		const bits = type === "int" ? 256 : Number.parseInt(type.slice(3));
		const unsigned = decodeUint256(data, offset);

		const mask = (1n << BigInt(bits)) - 1n;
		const masked = unsigned & mask;

		const signBitMask = 1n << (BigInt(bits) - 1n);
		let value;
		if (masked >= signBitMask) {
			value = masked - (1n << BigInt(bits));
		} else {
			value = masked;
		}
		return { value, newOffset: offset + 32 };
	}

	if (type === "address") {
		if (offset + 32 > data.length) {
			throw new AbiDecodingError("Data too small for address");
		}
		const slice = data.slice(offset, offset + 32);
		const addr = Address.fromAbiEncoded(slice);
		const hex = Address.toHex(addr);
		return { value: hex, newOffset: offset + 32 };
	}

	if (type === "bool") {
		if (offset + 32 > data.length) {
			throw new AbiDecodingError("Data too small for bool");
		}
		let isTrue = false;
		for (let i = 0; i < 32; i++) {
			if (data[offset + i] !== 0) {
				isTrue = true;
				break;
			}
		}
		return { value: isTrue, newOffset: offset + 32 };
	}

	if (type.startsWith("bytes") && type.length > 5) {
		const size = Number.parseInt(type.slice(5));
		if (size >= 1 && size <= 32) {
			if (offset + 32 > data.length) {
				throw new AbiDecodingError(`Data too small for ${type}`);
			}
			const value = data.slice(offset, offset + size);
			return { value, newOffset: offset + 32 };
		}
	}

	if (type === "bytes") {
		const dataOffset = Number(decodeUint256(data, offset));
		const length = Number(decodeUint256(data, dataOffset));
		if (dataOffset + 32 + length > data.length) {
			throw new AbiDecodingError("Data too small for bytes");
		}
		const value = data.slice(dataOffset + 32, dataOffset + 32 + length);
		return { value, newOffset: offset + 32 };
	}

	if (type === "string") {
		const dataOffset = Number(decodeUint256(data, offset));
		const length = Number(decodeUint256(data, dataOffset));
		if (dataOffset + 32 + length > data.length) {
			throw new AbiDecodingError("Data too small for string");
		}
		const bytes = data.slice(dataOffset + 32, dataOffset + 32 + length);
		const value = new TextDecoder().decode(bytes);
		return { value, newOffset: offset + 32 };
	}

	throw new AbiDecodingError(`Unsupported type: ${type}`);
}

/**
 * @template {readonly Parameter[]} TParams
 * @param {TParams} params
 * @param {ParametersToPrimitiveTypes<TParams>} values
 * @returns {Uint8Array}
 */
export function encodeParameters(params, values) {
	if (params.length !== values.length) {
		throw new AbiParameterMismatchError(
			`Parameter count mismatch: expected ${params.length}, got ${values.length}`,
			{
				value: values.length,
				expected: `${params.length} parameters`,
			},
		);
	}

	/** @type {Uint8Array[]} */
	const staticParts = [];
	/** @type {Uint8Array[]} */
	const dynamicParts = [];

	/** @type {Array<{ encoded: Uint8Array; isDynamic: boolean }>} */
	const encodings = [];
	for (let i = 0; i < params.length; i++) {
		const param = params[i];
		if (!param) continue;
		const value = values[i];
		encodings.push(encodeValue(param.type, value, param.components));
	}

	let dynamicOffset = params.length * 32;

	for (const { encoded, isDynamic } of encodings) {
		if (isDynamic) {
			staticParts.push(encodeUint256(BigInt(dynamicOffset)));
			dynamicParts.push(encoded);
			dynamicOffset += encoded.length;
		} else {
			staticParts.push(encoded);
		}
	}

	const totalLength =
		staticParts.reduce((sum, part) => sum + part.length, 0) +
		dynamicParts.reduce((sum, part) => sum + part.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;

	for (const part of staticParts) {
		result.set(part, offset);
		offset += part.length;
	}
	for (const part of dynamicParts) {
		result.set(part, offset);
		offset += part.length;
	}

	return result;
}

/**
 * @template {readonly Parameter[]} TParams
 * @param {TParams} params
 * @param {Uint8Array} data
 * @returns {ParametersToPrimitiveTypes<TParams>}
 */
export function decodeParameters(params, data) {
	/** @type {unknown[]} */
	const result = [];
	let offset = 0;

	for (const param of params) {
		const { value, newOffset } = decodeValue(
			param.type,
			data,
			offset,
			param.components,
		);
		result.push(value);
		offset = newOffset;
	}

	return /** @type {ParametersToPrimitiveTypes<TParams>} */ (result);
}

export {
	encodeUint256,
	encodeUint,
	encodeInt,
	encodeValue,
	decodeUint256,
	decodeValue,
	isDynamicType,
	padRight,
};

// Constructor-style aliases (data-first pattern)
export { encodeParameters as Parameters };
export { decodeParameters as DecodeParameters };
