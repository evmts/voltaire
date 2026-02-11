import type { HexType } from "../Hex/HexType.js";
import type { CallDataType } from "./CallDataType.js";
import * as BrandedCallData from "./internal-index.js";
export type { CallDataType } from "./CallDataType.js";
export * from "./constants.js";
export * from "./errors.js";
/**
 * Base CallData interface with instance methods
 */
export interface BaseCallData extends CallDataType {
    toHex(): HexType;
    toBytes(): Uint8Array;
    getSelector(): Uint8Array;
    hasSelector(selector: string | Uint8Array): boolean;
    equals(other: CallDataType): boolean;
}
/**
 * Creates CallData instances with prototype chain
 *
 * @see https://voltaire.tevm.sh/primitives/calldata for CallData documentation
 * @since 0.0.0
 * @param value - Value to convert (hex string or bytes)
 * @returns CallData instance with prototype methods
 * @throws {Error} If value format is invalid
 * @example
 * ```typescript
 * import { CallData } from './primitives/CallData/index.js';
 * const calldata = CallData('0xa9059cbb...');
 * console.log(calldata.toHex());
 * ```
 */
export declare function CallData(value: string | Uint8Array): BaseCallData;
export declare namespace CallData {
    var from: (value: string | Uint8Array) => CallDataType;
    var fromHex: (value: string) => CallDataType;
    var fromBytes: (value: Uint8Array) => CallDataType;
    var encode: (signature: string, params: unknown[]) => CallDataType;
    var toHex: typeof BrandedCallData.toHex;
    var toBytes: typeof BrandedCallData.toBytes;
    var getSelector: typeof BrandedCallData.getSelector;
    var hasSelector: typeof BrandedCallData.hasSelector;
    var equals: typeof BrandedCallData.equals;
    var is: typeof BrandedCallData.is;
    var isValid: typeof BrandedCallData.isValid;
    var decode: typeof BrandedCallData.decode;
    var MIN_SIZE: number;
    var SELECTOR_SIZE: number;
}
export declare const from: (value: string | Uint8Array) => CallDataType;
export declare const fromHex: (value: string) => CallDataType;
export declare const fromBytes: (value: Uint8Array) => CallDataType;
export declare const toHex: typeof BrandedCallData.toHex;
export declare const toBytes: typeof BrandedCallData.toBytes;
export declare const getSelector: typeof BrandedCallData.getSelector;
export declare const hasSelector: typeof BrandedCallData.hasSelector;
export declare const equals: typeof BrandedCallData.equals;
export declare const is: typeof BrandedCallData.is;
export declare const isValid: typeof BrandedCallData.isValid;
export declare const encode: (signature: string, params: unknown[]) => CallDataType;
export declare const decode: typeof BrandedCallData.decode;
export default CallData;
//# sourceMappingURL=index.d.ts.map