import { parse } from "./parse.js";
/**
 * Create SourceMap from source map string
 *
 * @see https://voltaire.tevm.sh/primitives/source-map for SourceMap documentation
 * @see https://docs.soliditylang.org/en/latest/internals/source_mappings.html
 * @since 0.0.0
 * @param {string} raw - Source map string (semicolon-separated entries)
 * @returns {import('./SourceMapType.js').SourceMap} SourceMap
 * @example
 * ```javascript
 * import * as SourceMap from './primitives/SourceMap/index.js';
 * const map = SourceMap.from("0:50:0:-;51:100:0:-;");
 * ```
 */
export function from(raw) {
    return parse(raw);
}
