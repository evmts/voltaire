import type { AddressType } from "../Address/AddressType.js";
import type { ChainIdType } from "../ChainId/ChainIdType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
/**
 * EIP-2612 Permit message structure
 */
export interface PermitType {
    readonly owner: AddressType;
    readonly spender: AddressType;
    readonly value: Uint256Type;
    readonly nonce: Uint256Type;
    readonly deadline: Uint256Type;
}
/**
 * EIP-712 Domain for Permit signatures
 */
export interface PermitDomainType {
    readonly name: string;
    readonly version: string;
    readonly chainId: ChainIdType;
    readonly verifyingContract: AddressType;
}
//# sourceMappingURL=PermitType.d.ts.map