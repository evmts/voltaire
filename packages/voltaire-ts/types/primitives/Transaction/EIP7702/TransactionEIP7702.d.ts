/**
 * @typedef {import('./TransactionEIP7702Type.js').TransactionEIP7702Type} TransactionEIP7702Type
 * @typedef {import('./TransactionEIP7702Constructor.js').TransactionEIP7702Constructor} TransactionEIP7702Constructor
 */
/**
 * Factory function for creating EIP-7702 Transaction instances
 *
 * @type {TransactionEIP7702Constructor}
 * @param {Parameters<TransactionEIP7702Constructor>[0]} tx
 */
export function TransactionEIP7702(tx: Parameters<TransactionEIP7702Constructor>[0]): TransactionEIP7702Type;
export class TransactionEIP7702 {
    /**
     * @typedef {import('./TransactionEIP7702Type.js').TransactionEIP7702Type} TransactionEIP7702Type
     * @typedef {import('./TransactionEIP7702Constructor.js').TransactionEIP7702Constructor} TransactionEIP7702Constructor
     */
    /**
     * Factory function for creating EIP-7702 Transaction instances
     *
     * @type {TransactionEIP7702Constructor}
     * @param {Parameters<TransactionEIP7702Constructor>[0]} tx
     */
    constructor(tx: Parameters<TransactionEIP7702Constructor>[0]);
    serialize: typeof serialize;
    hash: (tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702) => Uint8Array;
    getSigningHash: (tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702) => Uint8Array;
    getSender: typeof getSender;
    verifySignature: (tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702) => boolean;
    getEffectiveGasPrice: typeof getEffectiveGasPrice;
}
export namespace TransactionEIP7702 {
    export let deserialize: (bytes: Uint8Array) => import("./TransactionEIP7702Type.js").TransactionEIP7702Type & {
        serialize: typeof import("./serialize.js").serialize;
        hash: typeof import("./hash.js").hash;
        getSigningHash: typeof import("./getSigningHash.js").getSigningHash;
        getSender: typeof import("./getSender.js").getSender;
        verifySignature: typeof import("./verifySignature.js").verifySignature;
        getEffectiveGasPrice: typeof import("./getEffectiveGasPrice.js").getEffectiveGasPrice;
    };
    export { serialize };
    export { hash };
    export { getSigningHash };
    export { getSender };
    export { verifySignature };
    export { getEffectiveGasPrice };
}
export * from "./BrandedTransactionEIP7702.js";
export type TransactionEIP7702Type = import("./TransactionEIP7702Type.js").TransactionEIP7702Type;
export type TransactionEIP7702Constructor = import("./TransactionEIP7702Constructor.js").TransactionEIP7702Constructor;
import { serialize } from "./serialize.js";
import { getSender } from "./getSender.js";
import { getEffectiveGasPrice } from "./getEffectiveGasPrice.js";
export const hash: (tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702) => Uint8Array;
export const getSigningHash: (tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702) => Uint8Array;
export const verifySignature: (tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702) => boolean;
import { deserialize } from "./deserialize.js";
import { GetSigningHash } from "./getSigningHash.js";
import { Hash } from "./hash.js";
import { VerifySignature } from "./verifySignature.js";
export { deserialize, GetSigningHash, getEffectiveGasPrice, getSender, Hash, serialize, VerifySignature };
//# sourceMappingURL=TransactionEIP7702.d.ts.map