/**
 * @typedef {import('./TransactionEIP4844Type.js').TransactionEIP4844Type} TransactionEIP4844Type
 * @typedef {import('./TransactionEIP4844Constructor.js').TransactionEIP4844Constructor} TransactionEIP4844Constructor
 */
/**
 * Factory function for creating EIP-4844 Transaction instances
 *
 * @type {TransactionEIP4844Constructor}
 * @param {Parameters<TransactionEIP4844Constructor>[0]} tx
 */
export function TransactionEIP4844(tx: Parameters<TransactionEIP4844Constructor>[0]): TransactionEIP4844Type;
export class TransactionEIP4844 {
    /**
     * @typedef {import('./TransactionEIP4844Type.js').TransactionEIP4844Type} TransactionEIP4844Type
     * @typedef {import('./TransactionEIP4844Constructor.js').TransactionEIP4844Constructor} TransactionEIP4844Constructor
     */
    /**
     * Factory function for creating EIP-4844 Transaction instances
     *
     * @type {TransactionEIP4844Constructor}
     * @param {Parameters<TransactionEIP4844Constructor>[0]} tx
     */
    constructor(tx: Parameters<TransactionEIP4844Constructor>[0]);
    serialize: typeof serialize;
    hash: (tx: import("./TransactionEIP4844Type.js").TransactionEIP4844Type) => Uint8Array;
    getSigningHash: (tx: import("./TransactionEIP4844Type.js").TransactionEIP4844Type) => Uint8Array;
    getSender: typeof getSender;
    verifySignature: (tx: import("./TransactionEIP4844Type.js").TransactionEIP4844Type) => boolean;
    getEffectiveGasPrice: typeof getEffectiveGasPrice;
    getBlobGasCost: typeof getBlobGasCost;
}
export namespace TransactionEIP4844 {
    export function deserialize(bytes: Uint8Array<ArrayBufferLike>): import("./TransactionEIP4844Type.js").TransactionEIP4844Type;
    export { serialize };
    export { hash };
    export { getSigningHash };
    export { getSender };
    export { verifySignature };
    export { getEffectiveGasPrice };
    export { getBlobGasCost };
}
export * from "./TransactionEIP4844Type.js";
export type TransactionEIP4844Type = import("./TransactionEIP4844Type.js").TransactionEIP4844Type;
export type TransactionEIP4844Constructor = import("./TransactionEIP4844Constructor.js").TransactionEIP4844Constructor;
import { serialize } from "./serialize.js";
import { getSender } from "./getSender.js";
import { getEffectiveGasPrice } from "./getEffectiveGasPrice.js";
import { getBlobGasCost } from "./getBlobGasCost.js";
export const hash: (tx: import("./TransactionEIP4844Type.js").TransactionEIP4844Type) => Uint8Array;
export const getSigningHash: (tx: import("./TransactionEIP4844Type.js").TransactionEIP4844Type) => Uint8Array;
export const verifySignature: (tx: import("./TransactionEIP4844Type.js").TransactionEIP4844Type) => boolean;
import { deserialize } from "./deserialize.js";
import { GetSigningHash } from "./getSigningHash.js";
import { Hash } from "./hash.js";
import { VerifySignature } from "./verifySignature.js";
export { deserialize, GetSigningHash, getBlobGasCost, getEffectiveGasPrice, getSender, Hash, serialize, VerifySignature };
//# sourceMappingURL=TransactionEIP4844.d.ts.map