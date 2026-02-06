import type { brand } from "../../../brand.js";
import type { AddressType as BrandedAddress } from "../../Address/AddressType.js";
import type { AccessList, Type, VersionedHash } from "../types.js";
/**
 * EIP-4844 Transaction type
 */
export type TransactionEIP4844Type = {
    readonly [brand]: "TransactionEIP4844";
    type: Type.EIP4844;
    chainId: bigint;
    nonce: bigint;
    maxPriorityFeePerGas: bigint;
    maxFeePerGas: bigint;
    gasLimit: bigint;
    to: BrandedAddress;
    value: bigint;
    data: Uint8Array;
    accessList: AccessList;
    maxFeePerBlobGas: bigint;
    blobVersionedHashes: readonly VersionedHash[];
    yParity: number;
    r: Uint8Array;
    s: Uint8Array;
};
//# sourceMappingURL=TransactionEIP4844Type.d.ts.map