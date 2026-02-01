import { parse } from "./parse.js";
/**
 * Compare two compiler versions
 *
 * @param {import('./CompilerVersionType.js').CompilerVersionType} a - First version
 * @param {import('./CompilerVersionType.js').CompilerVersionType} b - Second version
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 *
 * @example
 * ```typescript
 * const result = CompilerVersion.compare("v0.8.20", "v0.8.19");
 * console.log(result); // 1 (0.8.20 > 0.8.19)
 * ```
 */
export function compare(a, b) {
    const parsedA = parse(a);
    const parsedB = parse(b);
    // Compare major
    if (parsedA.major !== parsedB.major) {
        return parsedA.major > parsedB.major ? 1 : -1;
    }
    // Compare minor
    if (parsedA.minor !== parsedB.minor) {
        return parsedA.minor > parsedB.minor ? 1 : -1;
    }
    // Compare patch
    if (parsedA.patch !== parsedB.patch) {
        return parsedA.patch > parsedB.patch ? 1 : -1;
    }
    // If prerelease exists, version with prerelease is "less than" release version
    if (parsedA.prerelease && !parsedB.prerelease) {
        return -1;
    }
    if (!parsedA.prerelease && parsedB.prerelease) {
        return 1;
    }
    // Both have prereleases or neither do
    if (parsedA.prerelease && parsedB.prerelease) {
        return parsedA.prerelease.localeCompare(parsedB.prerelease);
    }
    // Versions are equal
    return 0;
}
