import type { BrandedRlp } from "./BrandedRlp.js";
import type { decode } from "./decode.js";
import type { encode } from "./encode.js";
import type { encodeBytes } from "./encodeBytes.js";
import type { encodeList } from "./encodeList.js";
import type { equals } from "./equals.js";
import type { flatten } from "./flatten.js";
import type { from } from "./from.js";
import type { fromJSON } from "./fromJSON.js";
import type { getEncodedLength } from "./getEncodedLength.js";
import type { isBytesData } from "./isBytesData.js";
import type { isData } from "./isData.js";
import type { isListData } from "./isListData.js";
import type { toJSON } from "./toJSON.js";

type RlpPrototype = BrandedRlp & {
	encode: typeof encode;
	equals: typeof equals;
	flatten: typeof flatten;
	toJSON: typeof toJSON;
	getEncodedLength: typeof getEncodedLength;
};

export interface RlpConstructor {
	(value: Uint8Array | BrandedRlp | BrandedRlp[]): BrandedRlp;
	prototype: RlpPrototype;
	from: typeof from;
	isData: typeof isData;
	isBytesData: typeof isBytesData;
	isListData: typeof isListData;
	encode: typeof encode;
	encodeBytes: typeof encodeBytes;
	encodeList: typeof encodeList;
	decode: typeof decode;
	getEncodedLength: typeof getEncodedLength;
	flatten: typeof flatten;
	equals: typeof equals;
	toJSON: typeof toJSON;
	fromJSON: typeof fromJSON;
}
