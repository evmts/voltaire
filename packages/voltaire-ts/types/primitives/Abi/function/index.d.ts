import { Function } from "./Function.js";
export * from "./errors.js";
export type { ExtractNames, FunctionType, Get } from "./FunctionType.js";
export * from "./statemutability.js";
import { decodeParams as _decodeParams } from "./decodeParams.js";
import { decodeResult as _decodeResult } from "./decodeResult.js";
import { encodeParams as _encodeParams } from "./encodeParams.js";
import { encodeResult as _encodeResult } from "./encodeResult.js";
import { GetSelector } from "./getSelector.js";
import { getSignature as _getSignature } from "./getSignature.js";
export { GetSelector };
export declare const getSelector: (fn: any) => Uint8Array;
export declare const getSignature: typeof _getSignature;
export declare const encodeParams: typeof _encodeParams;
export declare const decodeParams: typeof _decodeParams;
export declare const encodeResult: typeof _encodeResult;
export declare const decodeResult: typeof _decodeResult;
export { decodeParams as DecodeParams, decodeResult as DecodeResult, encodeParams as Params, encodeResult as Result, Function, getSignature as Signature, };
//# sourceMappingURL=index.d.ts.map