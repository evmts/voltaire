/**
 * RLP (Recursive Length Prefix) - Ethereum's serialization format
 *
 * Complete RLP encoding/decoding with strict validation matching Ethereum's spec.
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { Rlp } from './Rlp.js';
 *
 * // Factory function
 * const rlp = Rlp(new Uint8Array([1, 2, 3]));
 *
 * // Static methods
 * const encoded = Rlp.encode(rlp);
 * const decoded = Rlp.decode(encoded);
 *
 * // Instance methods
 * const encoded2 = rlp.encode();
 * ```
 */

// Import types
import type { RlpConstructor } from "./RlpConstructor.js";

// Import all method functions
import { decode } from "./decode.js";
import { encode } from "./encode.js";
import { encodeBytes } from "./encodeBytes.js";
import { encodeList } from "./encodeList.js";
import { equals } from "./equals.js";
import { flatten } from "./flatten.js";
import { from as fromValue } from "./from.js";
import { fromJSON } from "./fromJSON.js";
import { getEncodedLength } from "./getEncodedLength.js";
import { isBytesData } from "./isBytesData.js";
import { isData } from "./isData.js";
import { isListData } from "./isListData.js";
import { toJSON } from "./toJSON.js";

// Re-export types
export * from "./BrandedRlp.js";
export * from "./constants.js";
export * from "./errors.js";

// Re-export method functions for tree-shaking
export {
	decode,
	encode,
	encodeBytes,
	encodeList,
	equals,
	flatten,
	fromValue as from,
	fromJSON,
	getEncodedLength,
	isBytesData,
	isData,
	isListData,
	toJSON,
};

// Re-export types from methods
export type { Decoded } from "./decode.js";
export type { Encodable } from "./encode.js";

/**
 * Factory function for creating RLP instances
 */
export const Rlp = ((value) => {
	return fromValue(value);
}) as RlpConstructor;

// Initialize prototype
Rlp.prototype = {} as any;

// Attach static methods
Rlp.from = fromValue;
Rlp.isData = isData;
Rlp.isBytesData = isBytesData;
Rlp.isListData = isListData;
Rlp.encode = encode;
Rlp.encodeBytes = encodeBytes;
Rlp.encodeList = encodeList;
Rlp.decode = decode;
Rlp.getEncodedLength = getEncodedLength;
Rlp.flatten = flatten;
Rlp.equals = equals;
Rlp.toJSON = toJSON;
Rlp.fromJSON = fromJSON;

// Bind prototype methods using Function.prototype.call.bind
Rlp.prototype.encode = Function.prototype.call.bind(encode) as any;
Rlp.prototype.equals = Function.prototype.call.bind(equals) as any;
Rlp.prototype.flatten = Function.prototype.call.bind(flatten) as any;
Rlp.prototype.toJSON = Function.prototype.call.bind(toJSON) as any;
Rlp.prototype.getEncodedLength = Function.prototype.call.bind(getEncodedLength) as any;
