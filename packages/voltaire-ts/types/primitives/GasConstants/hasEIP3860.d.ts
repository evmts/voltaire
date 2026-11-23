/**
 * Check if a hardfork includes EIP-3860 (initcode size limit)
 *
 * True for Shanghai and every later fork.
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-3860
 * @throws {import('../errors/ValidationError.js').InvalidRangeError} If hardfork is unknown
 */
export function hasEIP3860(hardfork: import("./types.js").Hardfork): boolean;
//# sourceMappingURL=hasEIP3860.d.ts.map