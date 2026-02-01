import { parse } from "./parse.js";
/**
 * Convert source map string to array of entries
 *
 * @param {string} raw - Source map string
 * @returns {ReadonlyArray<import('./SourceMapType.js').SourceMapEntry>} Parsed entries
 * @example
 * ```javascript
 * import * as SourceMap from './primitives/SourceMap/index.js';
 * const entries = SourceMap.toEntries("0:50:0:-;51:100:0:-;");
 * console.log(entries[0].start); // 0
 * ```
 */
export function toEntries(raw) {
    return parse(raw).entries;
}
