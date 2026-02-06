import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { isEmpty as _isEmpty } from "./isEmpty.js";
import type { ReturnDataType } from "./ReturnDataType.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toHex as _toHex } from "./toHex.js";
export * from "./errors.js";
export type { ReturnDataType } from "./ReturnDataType.js";
/**
 * Create ReturnData from various input types
 */
export declare function from(value: string | Uint8Array): ReturnDataType;
/**
 * Create ReturnData from hex string
 */
export declare function fromHex(value: string): ReturnDataType;
/**
 * Create ReturnData from Uint8Array
 */
export declare function fromBytes(value: Uint8Array): ReturnDataType;
/**
 * Convert ReturnData to hex string
 */
export declare function toHex(data: ReturnDataType): string;
/**
 * Convert ReturnData to plain Uint8Array
 */
export declare function toBytes(data: ReturnDataType): Uint8Array;
/**
 * Check if two ReturnData instances are equal
 */
export declare function equals(a: ReturnDataType, b: ReturnDataType): boolean;
/**
 * Check if ReturnData is empty
 */
export declare function isEmpty(data: ReturnDataType): boolean;
/**
 * Internal exports for advanced usage
 */
export { _from, _fromHex, _fromBytes, _toHex, _toBytes, _equals, _isEmpty };
//# sourceMappingURL=index.d.ts.map