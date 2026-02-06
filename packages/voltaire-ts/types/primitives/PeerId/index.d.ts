export type { EnodeComponents, PeerIdType } from "./PeerIdType.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { parse as _parse } from "./parse.js";
import { toString as _toString } from "./toString.js";
export { from };
export declare function toString(peerId: string): string;
export declare function equals(peerId1: string, peerId2: string): boolean;
export declare function parse(peerId: string): import("./PeerIdType.js").EnodeComponents;
export { _toString, _equals, _parse };
export declare const PeerId: {
    from: typeof from;
    toString: typeof toString;
    equals: typeof equals;
    parse: typeof parse;
};
//# sourceMappingURL=index.d.ts.map