/**
 * Factory: Get function/event/error selector from signature string
 * @param {Object} deps - Crypto dependencies
 * @param {(str: string) => Uint8Array} deps.keccak256String - Keccak256 hash function for strings
 * @returns {(signature: string, options?: { type?: "function" | "event" | "error" }) => import("../Hex/index.js").HexType} Function that computes selector from signature
 *
 * @example
 * ```typescript
 * import { GetSelector } from './primitives/Abi/index.js';
 * import { keccak256String } from './primitives/Hash/index.js';
 *
 * const getSelector = GetSelector({ keccak256String });
 * const selector = getSelector("transfer(address,uint256)");
 * ```
 */
export function GetSelector({ keccak256String }: {
    keccak256String: (str: string) => Uint8Array;
}): (signature: string, options?: {
    type?: "function" | "event" | "error";
}) => import("../Hex/index.js").HexType;
//# sourceMappingURL=getSelector.d.ts.map