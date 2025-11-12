import type { BrandedRlp } from "./BrandedRlp/BrandedRlp.js";
import * as BrandedRlpNs from "./BrandedRlp/index.js";

// Re-export BrandedRlp type and errors
export * from "./BrandedRlp/errors.js";
export * from "./BrandedRlp/constants.js";
export type { BrandedRlp };

type RlpInput = Uint8Array | BrandedRlp | BrandedRlp[];

/**
 * Creates an RLP data structure from various inputs
 * @param value - Uint8Array, BrandedRlp, or array to convert
 * @returns BrandedRlp data structure
 * @example
 * ```typescript
 * const data = Rlp(new Uint8Array([1, 2, 3]))
 * ```
 */
export function Rlp(value: RlpInput) {
	return BrandedRlpNs.from(value);
}

/**
 * Alias for Rlp() constructor
 * @deprecated Use `Rlp()` constructor instead
 */
Rlp.from = (value: RlpInput) => BrandedRlpNs.from(value);
Rlp.from.prototype = Rlp.prototype;

Rlp.isData = BrandedRlpNs.isData;
Rlp.isBytesData = BrandedRlpNs.isBytesData;
Rlp.isListData = BrandedRlpNs.isListData;
Rlp.encode = BrandedRlpNs.encode;
Rlp.encodeBytes = BrandedRlpNs.encodeBytes;
Rlp.encodeList = BrandedRlpNs.encodeList;
Rlp.encodeArray = BrandedRlpNs.encodeArray;
Rlp.encodeObject = BrandedRlpNs.encodeObject;
Rlp.encodeVariadic = BrandedRlpNs.encodeVariadic;
Rlp.decode = BrandedRlpNs.decode;
Rlp.decodeArray = BrandedRlpNs.decodeArray;
Rlp.decodeObject = BrandedRlpNs.decodeObject;
Rlp.getEncodedLength = BrandedRlpNs.getEncodedLength;
Rlp.flatten = BrandedRlpNs.flatten;
Rlp.equals = BrandedRlpNs.equals;
Rlp.toJSON = BrandedRlpNs.toJSON;
Rlp.toRaw = BrandedRlpNs.toRaw;
Rlp.fromJSON = BrandedRlpNs.fromJSON;
Rlp.validate = BrandedRlpNs.validate;
Rlp.getLength = BrandedRlpNs.getLength;
Rlp.isList = BrandedRlpNs.isList;
Rlp.isString = BrandedRlpNs.isString;
Rlp.encodeBatch = BrandedRlpNs.encodeBatch;
Rlp.decodeBatch = BrandedRlpNs.decodeBatch;

Rlp.prototype.encode = Function.prototype.call.bind(BrandedRlpNs.encode);
Rlp.prototype.equals = Function.prototype.call.bind(BrandedRlpNs.equals);
Rlp.prototype.flatten = Function.prototype.call.bind(BrandedRlpNs.flatten);
Rlp.prototype.toJSON = Function.prototype.call.bind(BrandedRlpNs.toJSON);
Rlp.prototype.getEncodedLength = Function.prototype.call.bind(
	BrandedRlpNs.getEncodedLength,
);

// Export all from BrandedRlp for direct imports
export * from "./BrandedRlp/index.js";
