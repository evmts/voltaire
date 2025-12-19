export * from "./EventSignatureType.js";

import type {
	EventSignatureLike,
	EventSignatureType,
} from "./EventSignatureType.js";

import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { fromSignature as _fromSignature } from "./fromSignature.js";
import { toHex as _toHex } from "./toHex.js";

// Export typed versions
export const equals: (a: EventSignatureType, b: EventSignatureType) => boolean =
	_equals;
export const from: (value: EventSignatureLike) => EventSignatureType = _from;
export const fromHex: (hex: string) => EventSignatureType = _fromHex;
export const fromSignature: (signature: string) => EventSignatureType =
	_fromSignature;
export const toHex: (signature: EventSignatureType) => string = _toHex;

// Namespace export
export const EventSignature = {
	from,
	fromHex,
	fromSignature,
	toHex,
	equals,
};
