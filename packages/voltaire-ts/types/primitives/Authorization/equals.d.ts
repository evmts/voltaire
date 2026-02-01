/**
 * Check if two addresses are equal
 *
 * @see https://voltaire.tevm.sh/primitives/authorization
 * @since 0.0.0
 * @param {import("../Address/AddressType.js").AddressType} a - First address
 * @param {import("../Address/AddressType.js").AddressType} b - Second address
 * @returns {boolean} True if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as Authorization from './primitives/Authorization/index.js';
 * const addr1 = '0x742d35Cc...';
 * const addr2 = '0x742d35Cc...';
 * if (Authorization.equals(addr1, addr2)) {
 *   console.log('Addresses are equal');
 * }
 * ```
 */
export function equals(a: import("../Address/AddressType.js").AddressType, b: import("../Address/AddressType.js").AddressType): boolean;
/**
 * Check if authorization equals another
 *
 * @param {import("./AuthorizationType.js").AuthorizationType} auth1 - First authorization
 * @param {import("./AuthorizationType.js").AuthorizationType} auth2 - Second authorization
 * @returns {boolean} True if equal
 */
export function equalsAuth(auth1: import("./AuthorizationType.js").AuthorizationType, auth2: import("./AuthorizationType.js").AuthorizationType): boolean;
//# sourceMappingURL=equals.d.ts.map