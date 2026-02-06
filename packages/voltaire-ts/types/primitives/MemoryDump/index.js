import { from as _from } from "./from.js";
import { readWord as _readWord } from "./readWord.js";
import { slice as _slice } from "./slice.js";
// Export constructors
export { from } from "./from.js";
// Export public wrapper functions
export function readWord(dump, offset) {
    return _readWord(_from(dump), offset);
}
export function slice(dump, start, end) {
    return _slice(_from(dump), start, end);
}
// Export internal functions (tree-shakeable)
export { _readWord, _slice };
// Namespace export
export const MemoryDump = {
    from: _from,
    readWord,
    slice,
};
