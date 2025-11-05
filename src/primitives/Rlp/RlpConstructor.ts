import type { BrandedRlp } from "./BrandedRlp/BrandedRlp.js";
import type { decode } from "./BrandedRlp/decode.js";
import type { encode } from "./BrandedRlp/encode.js";
import type { encodeBytes } from "./BrandedRlp/encodeBytes.js";
import type { encodeList } from "./BrandedRlp/encodeList.js";
import type { equals } from "./BrandedRlp/equals.js";
import type { flatten } from "./BrandedRlp/flatten.js";
import type { from } from "./BrandedRlp/from.js";
import type { fromJSON } from "./BrandedRlp/fromJSON.js";
import type { getEncodedLength } from "./BrandedRlp/getEncodedLength.js";
import type { isBytesData } from "./BrandedRlp/isBytesData.js";
import type { isData } from "./BrandedRlp/isData.js";
import type { isListData } from "./BrandedRlp/isListData.js";
import type { toJSON } from "./BrandedRlp/toJSON.js";

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
