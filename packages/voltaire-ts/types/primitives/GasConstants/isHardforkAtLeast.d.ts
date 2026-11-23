/**
 * Check whether a hardfork is at or after a target hardfork.
 *
 * Resolves name aliases (`paris`, `constantinoplefix`, `glamsterdam`) and
 * compares with `Hardfork.isAtLeast`, so every fork after the
 * target (including `prague`, `osaka` and `amsterdam`) inherits its rules.
 *
 * @param {import('./types.js').Hardfork} hardfork - Hardfork to test
 * @param {import('../Hardfork/HardforkType.js').HardforkType} target - Fork that introduced the rule
 * @returns {boolean} Whether `hardfork` is at or after `target`
 * @throws {InvalidRangeError} If `hardfork` is not a known hardfork name
 */
export function isHardforkAtLeast(hardfork: import("./types.js").Hardfork, target: import("../Hardfork/HardforkType.js").HardforkType): boolean;
//# sourceMappingURL=isHardforkAtLeast.d.ts.map