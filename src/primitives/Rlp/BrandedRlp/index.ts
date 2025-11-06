// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedRlp.js";

import { decode } from "./decode.js";
import { decodeArray } from "./decodeArray.js";
import { decodeBatch } from "./decodeBatch.js";
import { decodeObject } from "./decodeObject.js";
import { encode } from "./encode.js";
import { encodeArray } from "./encodeArray.js";
import { encodeBatch } from "./encodeBatch.js";
import { encodeBytes } from "./encodeBytes.js";
import { encodeList } from "./encodeList.js";
import { encodeObject } from "./encodeObject.js";
import { encodeVariadic } from "./encodeVariadic.js";
import { equals } from "./equals.js";
import { flatten } from "./flatten.js";
import { from } from "./from.js";
import { fromJSON } from "./fromJSON.js";
import { getEncodedLength } from "./getEncodedLength.js";
import { getLength } from "./getLength.js";
import { isBytesData } from "./isBytesData.js";
import { isData } from "./isData.js";
import { isList } from "./isList.js";
import { isListData } from "./isListData.js";
import { isString } from "./isString.js";
import { toJSON } from "./toJSON.js";
import { toRaw } from "./toRaw.js";
import { validate } from "./validate.js";

// Export individual functions
export {
	from,
	isData,
	isBytesData,
	isListData,
	encode,
	encodeBytes,
	encodeList,
	encodeArray,
	encodeObject,
	encodeVariadic,
	decode,
	decodeArray,
	decodeObject,
	getEncodedLength,
	flatten,
	equals,
	toJSON,
	toRaw,
	fromJSON,
	validate,
	getLength,
	isList,
	isString,
	encodeBatch,
	decodeBatch,
};

// Namespace export
export const BrandedRlp = {
	from,
	isData,
	isBytesData,
	isListData,
	encode,
	encodeBytes,
	encodeList,
	encodeArray,
	encodeObject,
	encodeVariadic,
	decode,
	decodeArray,
	decodeObject,
	getEncodedLength,
	flatten,
	equals,
	toJSON,
	toRaw,
	fromJSON,
	validate,
	getLength,
	isList,
	isString,
	encodeBatch,
	decodeBatch,
};
