export type { ForkIdType } from "./ForkIdType.js";
import { from } from "./from.js";
import { matches as _matches } from "./matches.js";
import { toBytes as _toBytes } from "./toBytes.js";
export { from };
export declare function toBytes(forkId: Parameters<typeof from>[0]): Uint8Array;
export declare function matches(local: Parameters<typeof from>[0], remote: Parameters<typeof from>[0]): boolean;
export { _toBytes, _matches };
export declare const ForkId: {
    from: typeof from;
    toBytes: typeof toBytes;
    matches: typeof matches;
};
//# sourceMappingURL=index.d.ts.map