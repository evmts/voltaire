export type {
	ErrorSignatureLike,
	ErrorSignatureType,
} from "./ErrorSignatureType.js";
export { SIZE } from "./ErrorSignatureType.js";

import type {
	ErrorSignatureLike,
	ErrorSignatureType,
} from "./ErrorSignatureType.js";

import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { fromSignature as _fromSignature } from "./fromSignature.js";
import { toHex as _toHex } from "./toHex.js";

/**
 * Create ErrorSignature from various input types
 */
export function from(value: ErrorSignatureLike): ErrorSignatureType {
	return _from(value);
}

/**
 * Create ErrorSignature from hex string
 */
export function fromHex(hex: string): ErrorSignatureType {
	return _fromHex(hex);
}

/**
 * Compute ErrorSignature from error signature string
 */
export function fromSignature(signature: string): ErrorSignatureType {
	return _fromSignature(signature);
}

/**
 * Convert ErrorSignature to hex string
 */
export function toHex(signature: ErrorSignatureType): string {
	return _toHex(signature);
}

/**
 * Check if two ErrorSignatures are equal
 */
export function equals(a: ErrorSignatureType, b: ErrorSignatureType): boolean {
	return _equals(a, b);
}

// Namespace export
export const ErrorSignature = {
	from,
	fromHex,
	fromSignature,
	toHex,
	equals,
};
