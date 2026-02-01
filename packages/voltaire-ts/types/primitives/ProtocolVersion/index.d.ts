export { ETH_66, ETH_67, ETH_68, SNAP_1 } from "./constants.js";
export type { ProtocolVersionType } from "./ProtocolVersionType.js";
import { compare as _compare } from "./compare.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toString as _toString } from "./toString.js";
export { from };
export declare function toString(protocolVersion: string): string;
export declare function equals(protocolVersion1: string, protocolVersion2: string): boolean;
export declare function compare(protocolVersion1: string, protocolVersion2: string): number;
export { _toString, _equals, _compare };
export declare const ProtocolVersion: {
    from: typeof from;
    toString: typeof toString;
    equals: typeof equals;
    compare: typeof compare;
};
//# sourceMappingURL=index.d.ts.map