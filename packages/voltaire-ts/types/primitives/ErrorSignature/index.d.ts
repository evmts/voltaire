export type { ErrorSignatureLike, ErrorSignatureType, } from "./ErrorSignatureType.js";
export { SIZE } from "./ErrorSignatureType.js";
import type { ErrorSignatureLike, ErrorSignatureType } from "./ErrorSignatureType.js";
/**
 * Create ErrorSignature from various input types
 */
export declare function from(value: ErrorSignatureLike): ErrorSignatureType;
/**
 * Create ErrorSignature from hex string
 */
export declare function fromHex(hex: string): ErrorSignatureType;
/**
 * Compute ErrorSignature from error signature string
 */
export declare function fromSignature(signature: string): ErrorSignatureType;
/**
 * Convert ErrorSignature to hex string
 */
export declare function toHex(signature: ErrorSignatureType): string;
/**
 * Check if two ErrorSignatures are equal
 */
export declare function equals(a: ErrorSignatureType, b: ErrorSignatureType): boolean;
export declare const ErrorSignature: {
    from: typeof from;
    fromHex: typeof fromHex;
    fromSignature: typeof fromSignature;
    toHex: typeof toHex;
    equals: typeof equals;
};
//# sourceMappingURL=index.d.ts.map