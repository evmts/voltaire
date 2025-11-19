import { parse } from "./parse.js";

/**
 * Get major version number
 *
 * @param {import('./CompilerVersionType.js').CompilerVersionType} version - Version to extract from
 * @returns {number} Major version
 *
 * @example
 * ```typescript
 * const major = CompilerVersion.getMajor("v0.8.20");
 * console.log(major); // 0
 * ```
 */
export function getMajor(version) {
	return parse(version).major;
}
