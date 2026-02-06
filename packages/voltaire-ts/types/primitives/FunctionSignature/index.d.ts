export type { FunctionSignatureLike, FunctionSignatureType, } from "./FunctionSignatureType.js";
import type { FunctionSignatureLike, FunctionSignatureType } from "./FunctionSignatureType.js";
export declare function equals(a: FunctionSignatureType, b: FunctionSignatureType): boolean;
export declare function from(value: FunctionSignatureLike): FunctionSignatureType;
export declare function fromSignature(signature: string): FunctionSignatureType;
export declare function parseSignature(signature: string): {
    name: string;
    inputs: string[];
};
export declare function toHex(functionSig: FunctionSignatureType): string;
export declare const FunctionSignature: {
    from: typeof from;
    fromSignature: typeof fromSignature;
    toHex: typeof toHex;
    equals: typeof equals;
    parseSignature: typeof parseSignature;
};
//# sourceMappingURL=index.d.ts.map