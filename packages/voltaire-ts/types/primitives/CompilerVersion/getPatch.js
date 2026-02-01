import { parse } from "./parse.js";
/**
 * Get patch version number
 *
 * @param {import('./CompilerVersionType.js').CompilerVersionType} version - Version to extract from
 * @returns {number} Patch version
 *
 * @example
 * ```typescript
 * const patch = CompilerVersion.getPatch("v0.8.20");
 * console.log(patch); // 20
 * ```
 */
export function getPatch(version) {
    return parse(version).patch;
}
