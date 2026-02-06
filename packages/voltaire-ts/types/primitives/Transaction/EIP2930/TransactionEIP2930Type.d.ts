import type { brand } from "../../../brand.js";
import type { AddressType as BrandedAddress } from "../../Address/AddressType.js";
import type { AccessList, Type } from "../types.js";
/**
 * EIP-2930 Transaction type (Access List Transaction)
 *
 * @see https://eips.ethereum.org/EIPS/eip-2930
 * @since 0.0.0
 */
export type TransactionEIP2930Type = {
    readonly [brand]: "TransactionEIP2930";
    type: Type.EIP2930;
    chainId: bigint;
    nonce: bigint;
    gasPrice: bigint;
    gasLimit: bigint;
    to: BrandedAddress | null;
    value: bigint;
    data: Uint8Array;
    accessList: AccessList;
    yParity: number;
    r: Uint8Array;
    s: Uint8Array;
};
//# sourceMappingURL=TransactionEIP2930Type.d.ts.map