import type { brand } from "../../brand.js";
export type SelectorType = Uint8Array & {
    readonly [brand]: "Selector";
    readonly length: 4;
};
export type SelectorLike = SelectorType | string | Uint8Array;
export declare const SIZE = 4;
//# sourceMappingURL=SelectorType.d.ts.map