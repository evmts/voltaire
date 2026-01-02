// @ts-check

/** @import { Parameter } from "./Parameter.js" */

import { Address } from "../Address/index.js";
import { AbiDecodingError } from "./Errors.js";
import { decodeParameters } from "./decodeParameters.js";
import { isDynamicType } from "./isDynamicType.js";
import * as Uint from "../Uint/index.js";

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @returns {bigint}
 */
export function decodeUint256(data, offset) {
	if (offset + 32 > data.length) {
		throw new AbiDecodingError("Data too small for uint256");
	}
	const slice = data.slice(offset, offset + 32);
	return Uint.toBigInt(Uint.fromAbiEncoded(slice));
}

/**
 * Safely convert a bigint to a Number, throwing if it exceeds safe integer range.
 * Prevents integer overflow vulnerabilities when decoding ABI offsets/lengths.
 * @param {bigint} value - The bigint value to convert
 * @param {string} context - Description of what the value represents (for error messages)
 * @returns {number} The value as a safe JavaScript number
 * @throws {AbiDecodingError} If the value exceeds Number.MAX_SAFE_INTEGER
 */
function safeToNumber(value, context) {
	if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new AbiDecodingError(
			`${context} exceeds maximum safe integer (got ${value}, max ${Number.MAX_SAFE_INTEGER})`,
		);
	}
	return Number(value);
}

/**
 * @param {Parameter["type"]} type
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {readonly Parameter[]=} components
 * @returns {{ value: unknown; newOffset: number }}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ABI decoding requires handling many type variants in one function
export function decodeValue(type, data, offset, components) {
	// Handle tuples
	if (type === "tuple" && components) {
		const isDynamic = isDynamicType(type, components);
		if (isDynamic) {
			const dataOffset = safeToNumber(
				decodeUint256(data, offset),
				"Tuple data offset",
			);
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
		const dataOffset = safeToNumber(
			decodeUint256(data, offset),
			"Dynamic array data offset",
		);
		const length = safeToNumber(
			decodeUint256(data, dataOffset),
			"Dynamic array length",
		);

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
			const dataOffset = safeToNumber(
				decodeUint256(data, offset),
				"Fixed array data offset",
			);
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
		const dataOffset = safeToNumber(
			decodeUint256(data, offset),
			"Bytes data offset",
		);
		const length = safeToNumber(
			decodeUint256(data, dataOffset),
			"Bytes length",
		);
		if (dataOffset + 32 + length > data.length) {
			throw new AbiDecodingError("Data too small for bytes");
		}
		const value = data.slice(dataOffset + 32, dataOffset + 32 + length);
		return { value, newOffset: offset + 32 };
	}

	if (type === "string") {
		const dataOffset = safeToNumber(
			decodeUint256(data, offset),
			"String data offset",
		);
		const length = safeToNumber(
			decodeUint256(data, dataOffset),
			"String length",
		);
		if (dataOffset + 32 + length > data.length) {
			throw new AbiDecodingError("Data too small for string");
		}
		const bytes = data.slice(dataOffset + 32, dataOffset + 32 + length);
		const value = new TextDecoder().decode(bytes);
		return { value, newOffset: offset + 32 };
	}

	throw new AbiDecodingError(`Unsupported type: ${type}`);
}
