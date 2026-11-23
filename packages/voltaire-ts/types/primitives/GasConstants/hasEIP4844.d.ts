/**
 * Check if a hardfork includes EIP-4844 (blob transactions)
 *
 * True for Cancun and every later fork.
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-4844
 * @throws {import('../errors/ValidationError.js').InvalidRangeError} If hardfork is unknown
 */
export function hasEIP4844(hardfork: import("./types.js").Hardfork): boolean;
//# sourceMappingURL=hasEIP4844.d.ts.map