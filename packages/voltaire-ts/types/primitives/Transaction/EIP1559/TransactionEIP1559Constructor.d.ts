import type { AddressType as BrandedAddress } from "../../Address/AddressType.js";
import type { AccessList } from "../types.js";
import type { getEffectiveGasPrice } from "./getEffectiveGasPrice.js";
import type { getSender } from "./getSender.js";
import type { getSigningHash } from "./getSigningHash.js";
import type { hash } from "./hash.js";
import type { serialize } from "./serialize.js";
import type { TransactionEIP1559Type } from "./TransactionEIP1559Type.js";
import type { verifySignature } from "./verifySignature.js";
type TransactionEIP1559Prototype = TransactionEIP1559Type & {
    serialize: typeof serialize;
    hash: typeof hash;
    getSigningHash: typeof getSigningHash;
    getSender: typeof getSender;
    verifySignature: typeof verifySignature;
    getEffectiveGasPrice: typeof getEffectiveGasPrice;
};
export interface TransactionEIP1559Constructor {
    (tx: {
        chainId: bigint;
        nonce: bigint;
        maxPriorityFeePerGas: bigint;
        maxFeePerGas: bigint;
        gasLimit: bigint;
        to: BrandedAddress | null;
        value: bigint;
        data: Uint8Array;
        accessList: AccessList;
        yParity: number;
        r: Uint8Array;
        s: Uint8Array;
    }): TransactionEIP1559Prototype;
    prototype: TransactionEIP1559Prototype;
    deserialize(bytes: Uint8Array): TransactionEIP1559Prototype;
    serialize: typeof serialize;
    hash: typeof hash;
    getSigningHash: typeof getSigningHash;
    getSender: typeof getSender;
    verifySignature: typeof verifySignature;
    getEffectiveGasPrice: typeof getEffectiveGasPrice;
}
export {};
//# sourceMappingURL=TransactionEIP1559Constructor.d.ts.map