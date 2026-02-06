import type { brand } from "../../brand.js";
export type EventSignatureType = Uint8Array & {
    readonly [brand]: "EventSignature";
    readonly length: 32;
};
export type EventSignatureLike = EventSignatureType | string | Uint8Array;
export declare const SIZE = 32;
//# sourceMappingURL=EventSignatureType.d.ts.map