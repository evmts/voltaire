export * from "./SelectorType.js";
import type { SelectorLike, SelectorType } from "./SelectorType.js";
/**
 * Create Selector from various input types
 */
export declare function from(value: SelectorLike): SelectorType;
/**
 * Create Selector from hex string
 */
export declare function fromHex(hex: string): SelectorType;
/**
 * Compute Selector from function signature
 */
export declare function fromSignature(signature: string): SelectorType;
/**
 * Convert Selector to hex string
 */
export declare function toHex(selector: SelectorType): string;
/**
 * Check if two Selectors are equal
 */
export declare function equals(a: SelectorType, b: SelectorType): boolean;
export declare const Selector: {
    from: typeof from;
    fromHex: typeof fromHex;
    fromSignature: typeof fromSignature;
    toHex: typeof toHex;
    equals: typeof equals;
};
//# sourceMappingURL=index.d.ts.map