import type { EncodedDataType } from "./EncodedDataType.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { toBytes as _toBytes } from "./toBytes.js";
export type { EncodedDataType } from "./EncodedDataType.js";
export * from "./errors.js";
/**
 * Create EncodedData from various input types
 */
export declare function from(value: string | Uint8Array): EncodedDataType;
/**
 * Create EncodedData from Uint8Array
 */
export declare function fromBytes(value: Uint8Array): EncodedDataType;
/**
 * Convert EncodedData to Uint8Array
 */
export declare function toBytes(data: EncodedDataType): Uint8Array;
/**
 * Check if two EncodedData instances are equal
 */
export declare function equals(a: EncodedDataType, b: EncodedDataType): boolean;
/**
 * Internal exports for advanced usage
 */
export { _from, _fromBytes, _toBytes, _equals };
//# sourceMappingURL=index.d.ts.map