/**
 * Check if a chain supports a specific hardfork
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @param {import('./metadata.js').Hardfork} hardfork - Hardfork name
 * @returns {boolean} True if hardfork is supported
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * Chain.supportsHardfork(mainnet, 'london');  // => true
 * Chain.supportsHardfork(mainnet, 'prague');  // => false
 * ```
 */
export function supportsHardfork(chain: import("./ChainType.js").Chain, hardfork: import("./metadata.js").Hardfork): boolean;
//# sourceMappingURL=supportsHardfork.d.ts.map