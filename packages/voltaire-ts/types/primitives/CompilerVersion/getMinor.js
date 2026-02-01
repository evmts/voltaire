import { parse } from "./parse.js";
/**
 * Get minor version number
 *
 * @param {import('./CompilerVersionType.js').CompilerVersionType} version - Version to extract from
 * @returns {number} Minor version
 *
 * @example
 * ```typescript
 * const minor = CompilerVersion.getMinor("v0.8.20");
 * console.log(minor); // 8
 * ```
 */
export function getMinor(version) {
    return parse(version).minor;
}
