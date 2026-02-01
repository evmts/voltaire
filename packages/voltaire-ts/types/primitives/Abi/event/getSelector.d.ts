/**
 * Factory: Get event selector (keccak256 hash of signature)
 * @param {Object} deps - Crypto dependencies
 * @param {(str: string) => Uint8Array} deps.keccak256String - Keccak256 hash function for strings
 * @returns {(event: any) => import('../../Hash/HashType.js').HashType} Function that computes event selector
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @example
 * ```javascript
 * import { GetSelector } from './primitives/Abi/event/index.js';
 * import { keccak256String } from './primitives/Hash/index.js';
 *
 * const getSelector = GetSelector({ keccak256String });
 * const event = { type: "event", name: "Transfer", inputs: [{ type: "address", indexed: true }] };
 * const selector = getSelector(event);
 * ```
 */
export function GetSelector({ keccak256String }: {
    keccak256String: (str: string) => Uint8Array;
}): (event: any) => import("../../Hash/HashType.js").HashType;
//# sourceMappingURL=getSelector.d.ts.map