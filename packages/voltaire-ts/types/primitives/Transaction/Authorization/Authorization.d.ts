/**
 * @typedef {import('./BrandedAuthorization.js').BrandedAuthorization} BrandedAuthorization
 */
/**
 * Factory function for creating Authorization instances.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {{
 *   chainId: bigint,
 *   address: import('../../Address/index.js').BrandedAddress,
 *   nonce: bigint,
 *   yParity: number,
 *   r: Uint8Array,
 *   s: Uint8Array
 * }} auth - Authorization parameters
 * @returns {BrandedAuthorization} Authorization instance
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { Authorization } from './primitives/Transaction/Authorization/Authorization.js';
 * const auth = Authorization({
 *   chainId: 1n,
 *   address: addr,
 *   nonce: 0n,
 *   yParity: 0,
 *   r: new Uint8Array(32),
 *   s: new Uint8Array(32)
 * });
 * const hash = Authorization.getSigningHash(auth);
 * ```
 */
export function Authorization(auth: {
    chainId: bigint;
    address: import("../../Address/index.js").BrandedAddress;
    nonce: bigint;
    yParity: number;
    r: Uint8Array;
    s: Uint8Array;
}): BrandedAuthorization;
export class Authorization {
    /**
     * @typedef {import('./BrandedAuthorization.js').BrandedAuthorization} BrandedAuthorization
     */
    /**
     * Factory function for creating Authorization instances.
     *
     * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
     * @since 0.0.0
     * @param {{
     *   chainId: bigint,
     *   address: import('../../Address/index.js').BrandedAddress,
     *   nonce: bigint,
     *   yParity: number,
     *   r: Uint8Array,
     *   s: Uint8Array
     * }} auth - Authorization parameters
     * @returns {BrandedAuthorization} Authorization instance
     * @throws {never} Never throws
     * @example
     * ```javascript
     * import { Authorization } from './primitives/Transaction/Authorization/Authorization.js';
     * const auth = Authorization({
     *   chainId: 1n,
     *   address: addr,
     *   nonce: 0n,
     *   yParity: 0,
     *   r: new Uint8Array(32),
     *   s: new Uint8Array(32)
     * });
     * const hash = Authorization.getSigningHash(auth);
     * ```
     */
    constructor(auth: {
        chainId: bigint;
        address: import("../../Address/index.js").BrandedAddress;
        nonce: bigint;
        yParity: number;
        r: Uint8Array;
        s: Uint8Array;
    });
    getSigningHash: (thisArg: any, ...argArray: any[]) => any;
    verifySignature: (thisArg: any, ...argArray: any[]) => any;
    getAuthorizer: (thisArg: any, ...argArray: any[]) => any;
}
export namespace Authorization {
    export { getSigningHash };
    export { verifySignature };
    export { getAuthorizer };
}
export type BrandedAuthorization = import("./BrandedAuthorization.js").BrandedAuthorization;
import { getSigningHash } from "./getSigningHash.js";
import { verifySignature } from "./verifySignature.js";
import { getAuthorizer } from "./getAuthorizer.js";
export { getAuthorizer, getSigningHash, verifySignature };
//# sourceMappingURL=Authorization.d.ts.map