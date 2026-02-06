export * from "./EventSignatureType.js";
import type { EventSignatureLike, EventSignatureType } from "./EventSignatureType.js";
export declare const equals: (a: EventSignatureType, b: EventSignatureType) => boolean;
export declare const from: (value: EventSignatureLike) => EventSignatureType;
export declare const fromHex: (hex: string) => EventSignatureType;
export declare const fromSignature: (signature: string) => EventSignatureType;
export declare const toHex: (signature: EventSignatureType) => string;
export declare const EventSignature: {
    from: (value: EventSignatureLike) => EventSignatureType;
    fromHex: (hex: string) => EventSignatureType;
    fromSignature: (signature: string) => EventSignatureType;
    toHex: (signature: EventSignatureType) => string;
    equals: (a: EventSignatureType, b: EventSignatureType) => boolean;
};
//# sourceMappingURL=index.d.ts.map