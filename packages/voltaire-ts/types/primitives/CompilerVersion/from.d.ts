/**
 * Create CompilerVersion from string
 *
 * @param {string} value - Version string (e.g., "v0.8.20+commit.a1b2c3d4")
 * @returns {import('./CompilerVersionType.js').CompilerVersionType} CompilerVersion
 * @throws {Error} If version format is invalid
 *
 * @example
 * ```typescript
 * const version = CompilerVersion.from("v0.8.20+commit.a1b2c3d4");
 * const version2 = CompilerVersion.from("0.8.20"); // Also valid
 * ```
 */
export function from(value: string): import("./CompilerVersionType.js").CompilerVersionType;
//# sourceMappingURL=from.d.ts.map