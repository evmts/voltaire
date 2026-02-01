export type { MemoryDumpType } from "./MemoryDumpType.js";
import { from as _from } from "./from.js";
import { readWord as _readWord } from "./readWord.js";
import { slice as _slice } from "./slice.js";
export { from } from "./from.js";
export declare function readWord(dump: import("./MemoryDumpType.js").MemoryDumpType | Uint8Array, offset: number): Uint8Array;
export declare function slice(dump: import("./MemoryDumpType.js").MemoryDumpType | Uint8Array, start: number, end?: number): Uint8Array;
export { _readWord, _slice };
export declare const MemoryDump: {
    from: typeof _from;
    readWord: typeof readWord;
    slice: typeof slice;
};
//# sourceMappingURL=index.d.ts.map