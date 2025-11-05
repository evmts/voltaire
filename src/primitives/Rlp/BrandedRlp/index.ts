// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedRlp.js";

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

// Namespace export
export const BrandedRlp = {
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
