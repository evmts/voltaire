import type { brand } from "../../../brand.js";
export type Bytes64Type = Uint8Array & {
    readonly [brand]: "Bytes64";
    readonly size: 64;
};
/**
 * Inputs that can be converted to Bytes64
 */
export type Bytes64Like = Bytes64Type | string | Uint8Array;
export declare const SIZE = 64;
//# sourceMappingURL=Bytes64Type.d.ts.map