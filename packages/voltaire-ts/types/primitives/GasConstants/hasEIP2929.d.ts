/**
 * Check if a hardfork includes EIP-2929 (cold/warm access costs)
 *
 * True for Berlin and every later fork.
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-2929
 * @throws {import('../errors/ValidationError.js').InvalidRangeError} If hardfork is unknown
 */
export function hasEIP2929(hardfork: import("./types.js").Hardfork): boolean;
//# sourceMappingURL=hasEIP2929.d.ts.map