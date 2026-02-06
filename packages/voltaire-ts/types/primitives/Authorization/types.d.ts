/**
 * Authorization without signature (for hashing)
 */
export type Unsigned = {
    /**
     * - Chain ID where authorization is valid
     */
    chainId: bigint;
    /**
     * - Address to delegate code execution to
     */
    address: import("../Address/AddressType.js").AddressType;
    /**
     * - Nonce of the authorizing account
     */
    nonce: bigint;
};
/**
 * Delegation designation result
 */
export type DelegationDesignation = {
    /**
     * - Authority (signer) address
     */
    authority: import("../Address/AddressType.js").AddressType;
    /**
     * - Delegated code address
     */
    delegatedAddress: import("../Address/AddressType.js").AddressType;
};
//# sourceMappingURL=types.d.ts.map