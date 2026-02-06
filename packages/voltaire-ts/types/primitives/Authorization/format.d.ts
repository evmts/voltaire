/**
 * Format authorization to human-readable string
 *
 * @see https://voltaire.tevm.sh/primitives/authorization
 * @since 0.0.0
 * @param {import("./AuthorizationType.js").AuthorizationType | {chainId: bigint, address: import("../Address/AddressType.js").AddressType, nonce: bigint}} auth - Authorization to format
 * @returns {string} Human-readable string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Authorization from './primitives/Authorization/index.js';
 * const auth = { chainId: 1n, address: '0x742d35Cc...', nonce: 0n, yParity: 0, r: 0n, s: 0n };
 * console.log(Authorization.format(auth));
 * // "Authorization(chain=1, to=0x742d...51e3, nonce=0, r=0x0, s=0x0, v=0)"
 * ```
 */
export function format(auth: import("./AuthorizationType.js").AuthorizationType | {
    chainId: bigint;
    address: import("../Address/AddressType.js").AddressType;
    nonce: bigint;
}): string;
//# sourceMappingURL=format.d.ts.map