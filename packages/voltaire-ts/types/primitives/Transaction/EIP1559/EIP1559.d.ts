/**
 * @typedef {import('./TransactionEIP1559Type.js').BrandedTransactionEIP1559} BrandedTransactionEIP1559
 * @typedef {import('./TransactionEIP1559Constructor.js').TransactionEIP1559Constructor} TransactionEIP1559Constructor
 */
/**
 * Factory function for creating EIP-1559 Transaction instances
 *
 * @type {TransactionEIP1559Constructor}
 */
export function TransactionEIP1559(tx: any): BrandedTransactionEIP1559;
export class TransactionEIP1559 {
    /**
     * @typedef {import('./TransactionEIP1559Type.js').BrandedTransactionEIP1559} BrandedTransactionEIP1559
     * @typedef {import('./TransactionEIP1559Constructor.js').TransactionEIP1559Constructor} TransactionEIP1559Constructor
     */
    /**
     * Factory function for creating EIP-1559 Transaction instances
     *
     * @type {TransactionEIP1559Constructor}
     */
    constructor(tx: any);
    serialize: typeof serialize;
    hash: (tx: import("./TransactionEIP1559Type.js").BrandedTransactionEIP1559) => Uint8Array;
    getSigningHash: (tx: import("./TransactionEIP1559Type.js").BrandedTransactionEIP1559) => Uint8Array;
    getSender: typeof getSender;
    verifySignature: (tx: import("./TransactionEIP1559Type.js").BrandedTransactionEIP1559) => boolean;
    getEffectiveGasPrice: typeof getEffectiveGasPrice;
}
export namespace TransactionEIP1559 {
    export { deserialize };
    export { serialize };
    export { hash };
    export { getSigningHash };
    export { getSender };
    export { verifySignature };
    export { getEffectiveGasPrice };
}
export * from "./TransactionEIP1559Type.js";
export type BrandedTransactionEIP1559 = import("./TransactionEIP1559Type.js").BrandedTransactionEIP1559;
export type TransactionEIP1559Constructor = import("./TransactionEIP1559Constructor.js").TransactionEIP1559Constructor;
import { serialize } from "./serialize.js";
import { getSender } from "./getSender.js";
import { getEffectiveGasPrice } from "./getEffectiveGasPrice.js";
import { deserialize } from "./deserialize.js";
export const hash: (tx: import("./TransactionEIP1559Type.js").BrandedTransactionEIP1559) => Uint8Array;
export const getSigningHash: (tx: import("./TransactionEIP1559Type.js").BrandedTransactionEIP1559) => Uint8Array;
export const verifySignature: (tx: import("./TransactionEIP1559Type.js").BrandedTransactionEIP1559) => boolean;
import { Hash } from "./hash.js";
import { GetSigningHash } from "./getSigningHash.js";
import { VerifySignature } from "./verifySignature.js";
export { Hash, GetSigningHash, VerifySignature, deserialize, getEffectiveGasPrice, getSender, serialize };
//# sourceMappingURL=EIP1559.d.ts.map