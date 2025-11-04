// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";

import { decode } from "./decode.js";
import { encode } from "./encode.js";
import { encodeBytes } from "./encodeBytes.js";
import { encodeList } from "./encodeList.js";
import { equals } from "./equals.js";
import { flatten } from "./flatten.js";
import { from } from "./from.js";
import { fromJSON } from "./fromJSON.js";
import { getEncodedLength } from "./getEncodedLength.js";
import { isBytesData } from "./isBytesData.js";
import { isData } from "./isData.js";
import { isListData } from "./isListData.js";
import { toJSON } from "./toJSON.js";

// Export individual functions
export {
	from,
	isData,
	isBytesData,
	isListData,
	encode,
	encodeBytes,
	encodeList,
	decode,
	getEncodedLength,
	flatten,
	equals,
	toJSON,
	fromJSON,
};

/**
 * @typedef {import('./BrandedRlp.js').BrandedRlp} BrandedRlp
 * @typedef {import('./RlpConstructor.js').RlpConstructor} RlpConstructor
 */

/**
 * Factory function for creating RLP instances
 *
 * @type {RlpConstructor}
 */
export function Rlp(value) {
	return from(value);
}

Rlp.from = function (value) {
	return from(value);
};
Rlp.from.prototype = Rlp.prototype;

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

Rlp.prototype.encode = Function.prototype.call.bind(encode);
Rlp.prototype.equals = Function.prototype.call.bind(equals);
Rlp.prototype.flatten = Function.prototype.call.bind(flatten);
Rlp.prototype.toJSON = Function.prototype.call.bind(toJSON);
Rlp.prototype.getEncodedLength = Function.prototype.call.bind(getEncodedLength);
