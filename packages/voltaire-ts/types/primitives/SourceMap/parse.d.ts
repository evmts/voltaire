/**
 * Parse source map string into entries
 *
 * Solidity source map format: "s:l:f:j:m;s:l:f:j:m;..."
 * Fields can be omitted to inherit from previous entry (compression).
 *
 * @param {string} raw - Source map string
 * @returns {import('./SourceMapType.js').SourceMap} Parsed source map
 * @example
 * ```javascript
 * import * as SourceMap from './primitives/SourceMap/index.js';
 * const map = SourceMap.parse("0:50:0:-;51:100:0:-;151:25:0:o");
 * console.log(map.entries.length); // 3
 * ```
 */
export function parse(raw: string): import("./SourceMapType.js").SourceMap;
//# sourceMappingURL=parse.d.ts.map