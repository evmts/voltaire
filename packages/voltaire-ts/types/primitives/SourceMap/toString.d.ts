/**
 * Convert source map to compressed string format
 *
 * Applies compression: omits fields that match previous entry.
 *
 * @param {import('./SourceMapType.js').SourceMap} sourceMap - SourceMap
 * @returns {string} Compressed source map string
 * @example
 * ```javascript
 * import * as SourceMap from './primitives/SourceMap/index.js';
 * const map = SourceMap.from("0:50:0:-;51:100:0:-;");
 * const str = SourceMap.toString(map);
 * ```
 */
export function toString(sourceMap: import("./SourceMapType.js").SourceMap): string;
//# sourceMappingURL=toString.d.ts.map