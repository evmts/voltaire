import { verify } from "./index.js";
/**
 * Process authorization and return delegation designation
 *
 * @param {import("./AuthorizationType.js").AuthorizationType} auth - Authorization to process
 * @returns {{authority: import("../Address/AddressType.js").AddressType, delegatedAddress: import("../Address/AddressType.js").AddressType}} Delegation designation with authority and delegated address
 * @throws {import("./errors.js").ValidationError} if authorization is invalid
 *
 * @example
 * ```typescript
 * const auth: Item = {...};
 * const delegation = process(auth);
 * console.log(`${delegation.authority} delegates to ${delegation.delegatedAddress}`);
 * ```
 */
export function process(auth) {
    // Validate and recover authority
    const authority = verify(auth);
    return {
        authority,
        delegatedAddress: auth.address,
    };
}
