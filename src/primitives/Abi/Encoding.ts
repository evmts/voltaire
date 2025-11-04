import type { Address as AddressType } from "../Address/index.js";
import * as Address from "../Address/index.js";
import * as Uint from "../Uint/index.js";
import {
	AbiDecodingError,
	AbiEncodingError,
	AbiParameterMismatchError,
} from "./Errors.js";
import type { Parameter } from "./Parameter.js";

function encodeUint256(value: bigint): Uint8Array {
	return Uint.toAbiEncoded(Uint.from(value));
}

function encodeUint(value: bigint | number, bits: number): Uint8Array {
	const bigintValue = typeof value === "number" ? BigInt(value) : value;
	const max = (1n << BigInt(bits)) - 1n;
	if (bigintValue < 0n || bigintValue > max) {
		throw new AbiEncodingError(
			`Value ${bigintValue} out of range for uint${bits}`,
		);
	}
	return encodeUint256(bigintValue);
}

function encodeInt(value: bigint | number, bits: number): Uint8Array {
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

function padRight(data: Uint8Array): Uint8Array {
	const paddedLength = Math.ceil(data.length / 32) * 32;
	if (paddedLength === data.length) return data;
	const result = new Uint8Array(paddedLength);
	result.set(data, 0);
	return result;
}

function isDynamicType(type: Parameter["type"]): boolean {
	if (type === "string" || type === "bytes") return true;
	if (type.endsWith("[]")) return true;
	if (type.includes("[") && type.endsWith("]")) {
		const match = type.match(/^(.+)\[(\d+)\]$/);
		if (match && match[1]) {
			const elementType = match[1] as Parameter["type"];
			return isDynamicType(elementType);
		}
	}
	return false;
}

function encodeValue(
	type: Parameter["type"],
	value: unknown,
): { encoded: Uint8Array; isDynamic: boolean } {
	if (type.endsWith("[]")) {
		const elementType = type.slice(0, -2) as Parameter["type"];
		const array = value as unknown[];
		const length = encodeUint256(BigInt(array.length));

		const elementParams = array.map(() => ({ type: elementType }));
		const encodedElements = encodeParameters(
			elementParams as any,
			array as any,
		);

		const result = new Uint8Array(length.length + encodedElements.length);
		result.set(length, 0);
		result.set(encodedElements, length.length);
		return { encoded: result, isDynamic: true };
	}

	if (type.startsWith("uint")) {
		const bits = type === "uint" ? 256 : Number.parseInt(type.slice(4));
		const encoded = encodeUint(value as bigint | number, bits);
		return { encoded, isDynamic: false };
	}

	if (type.startsWith("int")) {
		const bits = type === "int" ? 256 : Number.parseInt(type.slice(3));
		const encoded = encodeInt(value as bigint | number, bits);
		return { encoded, isDynamic: false };
	}

	if (type === "address") {
		const addr = value as AddressType | string;
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
			const bytes = value as Uint8Array;
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
		const bytes = value as Uint8Array;
		const length = encodeUint256(BigInt(bytes.length));
		const data = padRight(bytes);
		const result = new Uint8Array(length.length + data.length);
		result.set(length, 0);
		result.set(data, length.length);
		return { encoded: result, isDynamic: true };
	}

	if (type === "string") {
		const str = value as string;
		const bytes = new TextEncoder().encode(str);
		const length = encodeUint256(BigInt(bytes.length));
		const data = padRight(bytes);
		const result = new Uint8Array(length.length + data.length);
		result.set(length, 0);
		result.set(data, length.length);
		return { encoded: result, isDynamic: true };
	}

	const fixedArrayMatch = type.match(/^(.+)\[(\d+)\]$/);
	if (fixedArrayMatch && fixedArrayMatch[1] && fixedArrayMatch[2]) {
		const elementType = fixedArrayMatch[1] as Parameter["type"];
		const arraySize = Number.parseInt(fixedArrayMatch[2]);
		const array = value as unknown[];

		if (array.length !== arraySize) {
			throw new AbiEncodingError(
				`Array length mismatch: expected ${arraySize}, got ${array.length}`,
			);
		}

		const elementParams = array.map(() => ({ type: elementType }));
		const encoded = encodeParameters(elementParams as any, array as any);
		const isDynamic = isDynamicType(elementType);
		return { encoded, isDynamic };
	}

	throw new AbiEncodingError(`Unsupported type: ${type}`);
}

function decodeUint256(data: Uint8Array, offset: number): bigint {
	if (offset + 32 > data.length) {
		throw new AbiDecodingError("Data too small for uint256");
	}
	const slice = data.slice(offset, offset + 32);
	return Uint.toBigInt(Uint.fromAbiEncoded(slice));
}

function decodeValue(
	type: Parameter["type"],
	data: Uint8Array,
	offset: number,
): { value: unknown; newOffset: number } {
	if (type.endsWith("[]")) {
		const elementType = type.slice(0, -2) as Parameter["type"];
		const dataOffset = Number(decodeUint256(data, offset));
		const length = Number(decodeUint256(data, dataOffset));

		const elementParams = Array(length).fill({ type: elementType });
		const value = decodeParameters(
			elementParams as any,
			data.slice(dataOffset + 32),
		);
		return { value, newOffset: offset + 32 };
	}

	const fixedArrayMatch = type.match(/^(.+)\[(\d+)\]$/);
	if (fixedArrayMatch && fixedArrayMatch[1] && fixedArrayMatch[2]) {
		const elementType = fixedArrayMatch[1] as Parameter["type"];
		const arraySize = Number.parseInt(fixedArrayMatch[2]);

		const elementParams = Array(arraySize).fill({ type: elementType });
		if (isDynamicType(elementType)) {
			const dataOffset = Number(decodeUint256(data, offset));
			const value = decodeParameters(
				elementParams as any,
				data.slice(dataOffset),
			);
			return { value, newOffset: offset + 32 };
		} else {
			const value = decodeParameters(elementParams as any, data.slice(offset));
			return { value, newOffset: offset + arraySize * 32 };
		}
	}

	if (type.startsWith("uint")) {
		const bits = type === "uint" ? 256 : Number.parseInt(type.slice(4));
		const value = decodeUint256(data, offset);
		const max = (1n << BigInt(bits)) - 1n;
		if (value > max) {
			throw new AbiDecodingError(`Value ${value} out of range for ${type}`);
		}
		if (bits < 64) {
			return { value: Number(value), newOffset: offset + 32 };
		}
		return { value, newOffset: offset + 32 };
	}

	if (type.startsWith("int")) {
		const bits = type === "int" ? 256 : Number.parseInt(type.slice(3));
		const unsigned = decodeUint256(data, offset);

		const mask = (1n << BigInt(bits)) - 1n;
		const masked = unsigned & mask;

		const signBitMask = 1n << (BigInt(bits) - 1n);
		let value: bigint;
		if (masked >= signBitMask) {
			value = masked - (1n << BigInt(bits));
		} else {
			value = masked;
		}
		if (bits <= 32) {
			return { value: Number(value), newOffset: offset + 32 };
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

export function encodeParameters<const TParams extends readonly Parameter[]>(
	params: TParams,
	values: import("./Parameter.js").ParametersToPrimitiveTypes<TParams>,
): Uint8Array {
	if (params.length !== values.length) {
		throw new AbiParameterMismatchError(
			`Parameter count mismatch: expected ${params.length}, got ${values.length}`,
		);
	}

	const staticParts: Uint8Array[] = [];
	const dynamicParts: Uint8Array[] = [];

	const encodings: Array<{ encoded: Uint8Array; isDynamic: boolean }> = [];
	for (let i = 0; i < params.length; i++) {
		const param = params[i];
		if (!param) continue;
		const value = values[i];
		encodings.push(encodeValue(param.type, value));
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

export function decodeParameters<const TParams extends readonly Parameter[]>(
	params: TParams,
	data: Uint8Array,
): import("./Parameter.js").ParametersToPrimitiveTypes<TParams> {
	const result: unknown[] = [];
	let offset = 0;

	for (const param of params) {
		const { value } = decodeValue(param.type, data, offset);
		result.push(value);
		offset += 32;
	}

	return result as import("./Parameter.js").ParametersToPrimitiveTypes<TParams>;
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
