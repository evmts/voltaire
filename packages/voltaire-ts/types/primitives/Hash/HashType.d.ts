import type { brand } from "../../brand.js";
export type HashType = Uint8Array & {
    readonly [brand]: "Hash";
};
/**
 * Inputs that can be converted to Hash
 */
export type HashLike = HashType | bigint | string | Uint8Array;
export declare const SIZE = 32;
//# sourceMappingURL=HashType.d.ts.map