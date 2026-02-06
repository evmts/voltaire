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
export function compare(a: import("./CompilerVersionType.js").CompilerVersionType, b: import("./CompilerVersionType.js").CompilerVersionType): number;
//# sourceMappingURL=compare.d.ts.map