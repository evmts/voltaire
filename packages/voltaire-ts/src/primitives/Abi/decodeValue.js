// @ts-check

/** @import { Parameter } from "./Parameter.js" */

import { Address } from "../Address/index.js";
import * as Uint from "../Uint/index.js";
import { AbiDecodingError } from "./Errors.js";
import { isDynamicType } from "./isDynamicType.js";
import { staticSize } from "./staticSize.js";

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @returns {bigint}
 */
export function decodeUint256(data, offset) {
	if (offset + 32 > data.length) {
		throw new AbiDecodingError("Data too small for uint256");
	}
	return Uint.toBigInt(Uint.fromAbiEncoded(data.subarray(offset, offset + 32)));
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
 * Upper bound on elements for a dynamic array whose element head size is
 * zero (for example `tuple()[]`), where the payload cannot bound the length.
 */
const MAX_ZERO_SIZE_ELEMENTS = 1024;

/**
 * Work allowance for one decode call, shared by every top-level parameter
 * and every nested value. Mutated as values are produced.
 *
 * @typedef {{ remainingElements: number, remainingBytes: number }} DecodeBudget
 */

// Aliased offsets can decode the same tail repeatedly, so payload bounds
// alone do not bound the number of values produced.
const MAX_TOTAL_ELEMENTS = 100_000;

/**
 * Create the budget for decoding `data`.
 *
 * `remainingBytes` equals the payload length: a canonical encoding stores
 * every `bytes`, `string` and `bytesN` value in its own payload bytes, so the
 * copies made while decoding never exceed the payload. Aliased tails that
 * would copy more than the payload holds are rejected.
 *
 * @param {Uint8Array} data - Whole payload being decoded
 * @returns {DecodeBudget}
 */
export function createDecodeBudget(data) {
	return { remainingElements: MAX_TOTAL_ELEMENTS, remainingBytes: data.length };
}

/**
 * Charge `count` copied bytes (bytes, string, bytesN) to the budget.
 * @param {number} count
 * @param {DecodeBudget} budget
 */
function chargeBytes(count, budget) {
	if (count > budget.remainingBytes) {
		throw new AbiDecodingError("ABI decode byte budget exceeded");
	}
	budget.remainingBytes -= count;
}

/**
 * @param {number} count
 * @param {DecodeBudget} budget
 */
function checkElementBudget(count, budget) {
	if (count > budget.remainingElements) {
		throw new AbiDecodingError("ABI decode element budget exceeded");
	}
}

/**
 * @param {readonly Parameter[]} params
 * @param {Uint8Array} data
 * @param {DecodeBudget} budget
 * @returns {unknown[]}
 */
function decodeParameters(params, data, budget) {
	checkElementBudget(params.length, budget);
	const values = [];
	let offset = 0;
	for (const { type, components } of params) {
		const { value, newOffset } = decodeValue(
			type,
			data,
			offset,
			components,
			budget,
		);
		values.push(value);
		offset = newOffset;
	}
	return values;
}

/**
 * @param {Parameter["type"]} type
 * @param {readonly Parameter[] | undefined} components
 * @param {number} length
 * @param {Uint8Array} data
 * @param {DecodeBudget} budget
 * @returns {unknown[]}
 */
function decodeArray(type, components, length, data, budget) {
	checkElementBudget(length, budget);
	const values = [];
	let offset = 0;
	for (let i = 0; i < length; i++) {
		const { value, newOffset } = decodeValue(
			type,
			data,
			offset,
			components,
			budget,
		);
		values.push(value);
		offset = newOffset;
	}
	return values;
}

/**
 * Decode a right-aligned fixed-size byte value (bytesN, function).
 * The trailing `32 - size` bytes must be zero.
 * @param {string} type
 * @param {number} size
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeBudget} budget
 * @returns {{ value: Uint8Array; newOffset: number }}
 */
function decodeFixedBytes(type, size, data, offset, budget) {
	if (offset + 32 > data.length) {
		throw new AbiDecodingError(`Data too small for ${type}`);
	}
	chargeBytes(size, budget);
	for (let i = size; i < 32; i++) {
		if (data[offset + i] !== 0) {
			throw new AbiDecodingError(
				`Non-canonical ${type}: trailing ${32 - size} bytes must be zero`,
			);
		}
	}
	return { value: data.slice(offset, offset + size), newOffset: offset + 32 };
}

/**
 * @param {Parameter["type"]} type
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {readonly Parameter[]=} components
 * @param {DecodeBudget} [budget] - Shared budget; defaults to a fresh budget for `data`
 * @returns {{ value: unknown; newOffset: number }}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ABI decoding requires handling many type variants in one function
export function decodeValue(
	type,
	data,
	offset,
	components,
	budget = createDecodeBudget(data),
) {
	checkElementBudget(1, budget);
	budget.remainingElements--;

	// Handle tuples
	if (type === "tuple" && components) {
		const isDynamic = isDynamicType(type, components);
		if (isDynamic) {
			const dataOffset = safeToNumber(
				decodeUint256(data, offset),
				"Tuple data offset",
			);
			const value = decodeParameters(
				components,
				data.subarray(dataOffset),
				budget,
			);
			return { value, newOffset: offset + 32 };
		}
		// Static tuple - decode inline
		const value = decodeParameters(components, data.subarray(offset), budget);
		// Calculate static size by summing actual component sizes (fixed-size
		// arrays and nested static tuples occupy more than 32 bytes each).
		return { value, newOffset: offset + staticSize(type, components) };
	}

	if (type.endsWith("[]")) {
		const elementType = /** @type {Parameter["type"]} */ (type.slice(0, -2));
		const dataOffset = safeToNumber(
			decodeUint256(data, offset),
			"Dynamic array data offset",
		);
		if (dataOffset + 32 > data.length) {
			throw new AbiDecodingError(
				`Dynamic array data offset ${dataOffset} out of bounds (data length ${data.length})`,
			);
		}
		const length = safeToNumber(
			decodeUint256(data, dataOffset),
			"Dynamic array length",
		);
		// Bound the declared length by the payload before allocating. Every
		// element occupies at least one 32-byte head word, so a length larger
		// than the remaining words cannot be valid and would otherwise let a
		// tiny payload force a huge allocation.
		const remaining = data.length - (dataOffset + 32);
		const elemHeadSize = isDynamicType(elementType, components)
			? 32
			: staticSize(elementType, components);
		if (
			elemHeadSize === 0
				? length > MAX_ZERO_SIZE_ELEMENTS
				: BigInt(length) * BigInt(elemHeadSize) > BigInt(remaining)
		) {
			throw new AbiDecodingError(
				`Dynamic array length ${length} exceeds remaining payload (${remaining} bytes)`,
			);
		}

		const value = decodeArray(
			elementType,
			components,
			length,
			data.subarray(dataOffset + 32),
			budget,
		);
		return { value, newOffset: offset + 32 };
	}

	const fixedArrayMatch = type.match(/^(.+)\[(\d+)\]$/);
	if (fixedArrayMatch?.[1] && fixedArrayMatch[2]) {
		const elementType = /** @type {Parameter["type"]} */ (fixedArrayMatch[1]);
		const arraySize = Number.parseInt(fixedArrayMatch[2], 10);

		if (isDynamicType(elementType, components)) {
			const dataOffset = safeToNumber(
				decodeUint256(data, offset),
				"Fixed array data offset",
			);
			const value = decodeArray(
				elementType,
				components,
				arraySize,
				data.subarray(dataOffset),
				budget,
			);
			return { value, newOffset: offset + 32 };
		}
		const value = decodeArray(
			elementType,
			components,
			arraySize,
			data.subarray(offset),
			budget,
		);
		// Static elements are encoded inline; nested arrays and static tuples
		// occupy more than one word each, so use the full static size.
		return { value, newOffset: offset + staticSize(type, components) };
	}

	if (type.startsWith("uint")) {
		const bits = type === "uint" ? 256 : Number.parseInt(type.slice(4), 10);
		const value = decodeUint256(data, offset);
		const max = (1n << BigInt(bits)) - 1n;
		if (value > max) {
			throw new AbiDecodingError(`Value ${value} out of range for ${type}`);
		}
		return { value, newOffset: offset + 32 };
	}

	if (type.startsWith("int")) {
		const bits = type === "int" ? 256 : Number.parseInt(type.slice(3), 10);
		const unsigned = decodeUint256(data, offset);
		if (bits === 256) {
			const value = unsigned >= 1n << 255n ? unsigned - (1n << 256n) : unsigned;
			return { value, newOffset: offset + 32 };
		}
		// Canonical encoding sign-extends to 256 bits: the upper 256 - bits
		// bits must all equal the sign bit.
		const mask = (1n << BigInt(bits)) - 1n;
		const masked = unsigned & mask;
		const negative = masked >= 1n << (BigInt(bits) - 1n);
		const high = unsigned >> BigInt(bits);
		const expectedHigh = negative ? (1n << BigInt(256 - bits)) - 1n : 0n;
		if (high !== expectedHigh) {
			throw new AbiDecodingError(
				`Non-canonical ${type}: upper ${256 - bits} bits must sign-extend`,
			);
		}
		const value = negative ? masked - (1n << BigInt(bits)) : masked;
		return { value, newOffset: offset + 32 };
	}

	if (type === "address") {
		if (offset + 32 > data.length) {
			throw new AbiDecodingError("Data too small for address");
		}
		for (let i = 0; i < 12; i++) {
			if (data[offset + i] !== 0) {
				throw new AbiDecodingError(
					"Non-canonical address: leading 12 bytes must be zero",
				);
			}
		}
		const slice = data.subarray(offset, offset + 32);
		const addr = Address.fromAbiEncoded(slice);
		const hex = Address.toHex(addr);
		return { value: hex, newOffset: offset + 32 };
	}

	if (type === "bool") {
		if (offset + 32 > data.length) {
			throw new AbiDecodingError("Data too small for bool");
		}
		for (let i = 0; i < 31; i++) {
			if (data[offset + i] !== 0) {
				throw new AbiDecodingError(
					"Non-canonical bool: leading 31 bytes must be zero",
				);
			}
		}
		const last = data[offset + 31];
		if (last !== 0 && last !== 1) {
			throw new AbiDecodingError(
				`Non-canonical bool: expected 0 or 1, got ${last}`,
			);
		}
		return { value: last === 1, newOffset: offset + 32 };
	}

	// `function` is not in the Parameter type union but parseHumanReadable emits it.
	if (/** @type {string} */ (type) === "function") {
		// Solidity external function type: address (20) + selector (4) as bytes24.
		return decodeFixedBytes(type, 24, data, offset, budget);
	}

	if (type.startsWith("bytes") && type.length > 5) {
		const size = Number.parseInt(type.slice(5), 10);
		if (size >= 1 && size <= 32) {
			return decodeFixedBytes(type, size, data, offset, budget);
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
		chargeBytes(length, budget);
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
		chargeBytes(length, budget);
		const bytes = data.subarray(dataOffset + 32, dataOffset + 32 + length);
		const value = new TextDecoder().decode(bytes);
		return { value, newOffset: offset + 32 };
	}

	throw new AbiDecodingError(`Unsupported type: ${type}`);
}
