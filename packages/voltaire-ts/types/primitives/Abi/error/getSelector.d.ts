/**
 * Factory: Get the 4-byte selector for an error
 * @param {Object} deps - Crypto dependencies
 * @param {(str: string) => Uint8Array} deps.keccak256String - Keccak256 hash function for strings
 * @returns {(error: any) => Uint8Array} Function that computes error selector
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @example
 * ```javascript
 * import { GetSelector } from './primitives/Abi/error/index.js';
 * import { keccak256String } from './primitives/Hash/index.js';
 *
 * const getSelector = GetSelector({ keccak256String });
 * const error = { type: "error", name: "Unauthorized", inputs: [] };
 * const selector = getSelector(error);
 * ```
 */
export function GetSelector({ keccak256String }: {
    keccak256String: (str: string) => Uint8Array;
}): (error: any) => Uint8Array;
//# sourceMappingURL=getSelector.d.ts.map