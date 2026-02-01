import type { AddressType } from "../Address/AddressType.js";
import type { ChainIdType } from "../ChainId/ChainIdType.js";
import type { HashType } from "../Hash/HashType.js";
/**
 * EIP-712 field definition
 */
export type EIP712Field = {
    readonly name: string;
    readonly type: string;
};
/**
 * EIP-712 Domain Separator structure
 * Used to create domain-specific signatures for dApps
 *
 * At least one field must be defined
 */
export type DomainType = {
    readonly name?: string;
    readonly version?: string;
    readonly chainId?: ChainIdType;
    readonly verifyingContract?: AddressType;
    readonly salt?: HashType;
};
//# sourceMappingURL=DomainType.d.ts.map