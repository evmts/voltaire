export type {
	FunctionSignatureLike,
	FunctionSignatureType,
} from "./FunctionSignatureType.js";

import { equals as _equals } from "./equals.js";
import type {
	FunctionSignatureLike,
	FunctionSignatureType,
} from "./FunctionSignatureType.js";
import { from as _from } from "./from.js";
import { fromSignature as _fromSignature } from "./fromSignature.js";
import { parseSignature as _parseSignature } from "./parseSignature.js";
import { toHex as _toHex } from "./toHex.js";

// Type-safe wrappers
export function equals(
	a: FunctionSignatureType,
	b: FunctionSignatureType,
): boolean {
	return _equals(a, b);
}

export function from(value: FunctionSignatureLike): FunctionSignatureType {
	return _from(value);
}

export function fromSignature(signature: string): FunctionSignatureType {
	return _fromSignature(signature);
}

export function parseSignature(signature: string): {
	name: string;
	inputs: string[];
} {
	return _parseSignature(signature);
}

export function toHex(functionSig: FunctionSignatureType): string {
	return _toHex(functionSig);
}

// Namespace export
export const FunctionSignature = {
	from,
	fromSignature,
	toHex,
	equals,
	parseSignature,
};
