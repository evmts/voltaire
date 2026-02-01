import * as BrandedRlpNs from "./internal-index.js";
import type { BrandedRlp } from "./RlpType.js";
export * from "./constants.js";
export * from "./errors.js";
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
export declare function Rlp(value: RlpInput): BrandedRlp;
export declare namespace Rlp {
    var from: (value: RlpInput) => BrandedRlp;
    var isData: typeof BrandedRlpNs.isData;
    var isBytesData: typeof BrandedRlpNs.isBytesData;
    var isListData: typeof BrandedRlpNs.isListData;
    var encode: typeof BrandedRlpNs.encode;
    var encodeBytes: typeof BrandedRlpNs.encodeBytes;
    var encodeList: typeof BrandedRlpNs.encodeList;
    var encodeArray: typeof BrandedRlpNs.encodeArray;
    var encodeObject: typeof BrandedRlpNs.encodeObject;
    var encodeVariadic: typeof BrandedRlpNs.encodeVariadic;
    var decode: typeof BrandedRlpNs.decode;
    var decodeArray: typeof BrandedRlpNs.decodeArray;
    var decodeObject: typeof BrandedRlpNs.decodeObject;
    var decodeValue: typeof BrandedRlpNs.decodeValue;
    var getEncodedLength: typeof BrandedRlpNs.getEncodedLength;
    var flatten: typeof BrandedRlpNs.flatten;
    var equals: typeof BrandedRlpNs.equals;
    var toJSON: typeof BrandedRlpNs.toJSON;
    var toRaw: typeof BrandedRlpNs.toRaw;
    var fromJSON: typeof BrandedRlpNs.fromJSON;
    var validate: typeof BrandedRlpNs.validate;
    var isCanonical: typeof BrandedRlpNs.isCanonical;
    var getLength: typeof BrandedRlpNs.getLength;
    var isList: typeof BrandedRlpNs.isList;
    var isString: typeof BrandedRlpNs.isString;
    var encodeBatch: typeof BrandedRlpNs.encodeBatch;
    var decodeBatch: typeof BrandedRlpNs.decodeBatch;
}
export * from "./internal-index.js";
//# sourceMappingURL=index.d.ts.map