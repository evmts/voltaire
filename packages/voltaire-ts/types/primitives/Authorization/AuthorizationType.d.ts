import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
/**
 * EIP-7702 Authorization branded type
 * Allows EOA to delegate code execution to another address
 */
export type AuthorizationType = {
    /** Chain ID where authorization is valid */
    chainId: bigint;
    /** Address to delegate code execution to */
    address: BrandedAddress;
    /** Nonce of the authorizing account */
    nonce: bigint;
    /** Signature Y parity (0 or 1) */
    yParity: number;
    /** Signature r value (32 bytes) */
    r: Uint8Array;
    /** Signature s value (32 bytes) */
    s: Uint8Array;
};
/**
 * @deprecated Use AuthorizationType instead
 */
export type BrandedAuthorization = AuthorizationType;
//# sourceMappingURL=AuthorizationType.d.ts.map