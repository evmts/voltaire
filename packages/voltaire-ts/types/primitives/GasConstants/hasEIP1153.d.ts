/**
 * Check if a hardfork includes EIP-1153 (transient storage)
 *
 * True for Cancun and every later fork.
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-1153
 * @throws {import('../errors/ValidationError.js').InvalidRangeError} If hardfork is unknown
 */
export function hasEIP1153(hardfork: import("./types.js").Hardfork): boolean;
//# sourceMappingURL=hasEIP1153.d.ts.map