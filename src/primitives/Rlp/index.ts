// @ts-nocheck
import * as BrandedRlp from "./BrandedRlp/index.js";

// Re-export BrandedRlp type and errors
export type { BrandedRlp } from "./BrandedRlp/index.js";
export * from "./BrandedRlp/errors.js";
export * from "./BrandedRlp/constants.js";

/**
 * Factory function for creating RLP instances
 */
export function Rlp(value) {
	return BrandedRlp.from(value);
}

Rlp.from = (value) => BrandedRlp.from(value);
Rlp.from.prototype = Rlp.prototype;

Rlp.isData = BrandedRlp.isData;
Rlp.isBytesData = BrandedRlp.isBytesData;
Rlp.isListData = BrandedRlp.isListData;
Rlp.encode = BrandedRlp.encode;
Rlp.encodeBytes = BrandedRlp.encodeBytes;
Rlp.encodeList = BrandedRlp.encodeList;
Rlp.encodeArray = BrandedRlp.encodeArray;
Rlp.encodeObject = BrandedRlp.encodeObject;
Rlp.encodeVariadic = BrandedRlp.encodeVariadic;
Rlp.decode = BrandedRlp.decode;
Rlp.decodeArray = BrandedRlp.decodeArray;
Rlp.decodeObject = BrandedRlp.decodeObject;
Rlp.getEncodedLength = BrandedRlp.getEncodedLength;
Rlp.flatten = BrandedRlp.flatten;
Rlp.equals = BrandedRlp.equals;
Rlp.toJSON = BrandedRlp.toJSON;
Rlp.toRaw = BrandedRlp.toRaw;
Rlp.fromJSON = BrandedRlp.fromJSON;
Rlp.validate = BrandedRlp.validate;
Rlp.getLength = BrandedRlp.getLength;
Rlp.isList = BrandedRlp.isList;
Rlp.isString = BrandedRlp.isString;
Rlp.encodeBatch = BrandedRlp.encodeBatch;
Rlp.decodeBatch = BrandedRlp.decodeBatch;

Rlp.prototype.encode = Function.prototype.call.bind(BrandedRlp.encode);
Rlp.prototype.equals = Function.prototype.call.bind(BrandedRlp.equals);
Rlp.prototype.flatten = Function.prototype.call.bind(BrandedRlp.flatten);
Rlp.prototype.toJSON = Function.prototype.call.bind(BrandedRlp.toJSON);
Rlp.prototype.getEncodedLength = Function.prototype.call.bind(
	BrandedRlp.getEncodedLength,
);

// Export namespace
export { BrandedRlp };

// Export all from BrandedRlp for direct imports
export * from "./BrandedRlp/index.js";
