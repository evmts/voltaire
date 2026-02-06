/**
 * Parse compiler version into components
 *
 * @param {import('./CompilerVersionType.js').CompilerVersionType} version - Version to parse
 * @returns {{ major: number, minor: number, patch: number, commit?: string, prerelease?: string }}
 *
 * @example
 * ```typescript
 * const parsed = CompilerVersion.parse("v0.8.20+commit.a1b2c3d4");
 * console.log(parsed.major); // 0
 * console.log(parsed.minor); // 8
 * console.log(parsed.patch); // 20
 * console.log(parsed.commit); // "a1b2c3d4"
 * ```
 */
export function parse(version: import("./CompilerVersionType.js").CompilerVersionType): {
    major: number;
    minor: number;
    patch: number;
    commit?: string;
    prerelease?: string;
};
//# sourceMappingURL=parse.d.ts.map