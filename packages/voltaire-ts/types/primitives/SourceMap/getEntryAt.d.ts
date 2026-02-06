/**
 * Get source map entry for specific bytecode position
 *
 * @param {import('./SourceMapType.js').SourceMap} sourceMap - SourceMap
 * @param {number} pc - Program counter (bytecode offset)
 * @returns {import('./SourceMapType.js').SourceMapEntry | undefined} Entry at position
 * @example
 * ```javascript
 * import * as SourceMap from './primitives/SourceMap/index.js';
 * const map = SourceMap.from("0:50:0:-;51:100:0:-;");
 * const entry = SourceMap.getEntryAt(map, 1);
 * ```
 */
export function getEntryAt(sourceMap: import("./SourceMapType.js").SourceMap, pc: number): import("./SourceMapType.js").SourceMapEntry | undefined;
//# sourceMappingURL=getEntryAt.d.ts.map