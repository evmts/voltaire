import type { ReturnDataType } from "./ReturnDataType.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { isEmpty as _isEmpty } from "./isEmpty.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toHex as _toHex } from "./toHex.js";

export type { ReturnDataType } from "./ReturnDataType.js";
export * from "./errors.js";

/**
 * Create ReturnData from various input types
 */
export function from(value: string | Uint8Array): ReturnDataType {
	return _from(value);
}

/**
 * Create ReturnData from hex string
 */
export function fromHex(value: string): ReturnDataType {
	return _fromHex(value);
}

/**
 * Create ReturnData from Uint8Array
 */
export function fromBytes(value: Uint8Array): ReturnDataType {
	return _fromBytes(value);
}

/**
 * Convert ReturnData to hex string
 */
export function toHex(data: ReturnDataType): string {
	return _toHex(data);
}

/**
 * Convert ReturnData to plain Uint8Array
 */
export function toBytes(data: ReturnDataType): Uint8Array {
	return _toBytes(data);
}

/**
 * Check if two ReturnData instances are equal
 */
export function equals(a: ReturnDataType, b: ReturnDataType): boolean {
	return _equals(a, b);
}

/**
 * Check if ReturnData is empty
 */
export function isEmpty(data: ReturnDataType): boolean {
	return _isEmpty(data);
}

/**
 * Internal exports for advanced usage
 */
export { _from, _fromHex, _fromBytes, _toHex, _toBytes, _equals, _isEmpty };
