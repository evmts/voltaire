/**
 * @typedef {import('./TransactionEIP2930Type.js').TransactionEIP2930Type} TransactionEIP2930Type
 * @typedef {import('./TransactionEIP2930Constructor.js').TransactionEIP2930Constructor} TransactionEIP2930Constructor
 */
/**
 * Factory function for creating EIP-2930 Transaction instances
 *
 * @type {TransactionEIP2930Constructor}
 * @param {Parameters<TransactionEIP2930Constructor>[0]} tx
 */
export function TransactionEIP2930(tx: Parameters<TransactionEIP2930Constructor>[0]): TransactionEIP2930Type;
export class TransactionEIP2930 {
    /**
     * @typedef {import('./TransactionEIP2930Type.js').TransactionEIP2930Type} TransactionEIP2930Type
     * @typedef {import('./TransactionEIP2930Constructor.js').TransactionEIP2930Constructor} TransactionEIP2930Constructor
     */
    /**
     * Factory function for creating EIP-2930 Transaction instances
     *
     * @type {TransactionEIP2930Constructor}
     * @param {Parameters<TransactionEIP2930Constructor>[0]} tx
     */
    constructor(tx: Parameters<TransactionEIP2930Constructor>[0]);
    serialize: typeof serialize;
    hash: (tx: import("./TransactionEIP2930Type.js").TransactionEIP2930Type) => Uint8Array;
    getSigningHash: (tx: import("./TransactionEIP2930Type.js").TransactionEIP2930Type) => Uint8Array;
    getSender: typeof getSender;
    verifySignature: (tx: import("./TransactionEIP2930Type.js").TransactionEIP2930Type) => boolean;
}
export namespace TransactionEIP2930 {
    export let deserialize: (bytes: Uint8Array) => import("./TransactionEIP2930Type.js").TransactionEIP2930Type & {
        serialize: typeof import("./serialize.js").serialize;
        hash: typeof import("./hash.js").hash;
        getSigningHash: typeof import("./getSigningHash.js").getSigningHash;
        getSender: typeof import("./getSender.js").getSender;
        verifySignature: typeof import("./verifySignature.js").verifySignature;
    };
    export { serialize };
    export { hash };
    export { getSigningHash };
    export { getSender };
    export { verifySignature };
}
export * from "./TransactionEIP2930Type.js";
export type TransactionEIP2930Type = import("./TransactionEIP2930Type.js").TransactionEIP2930Type;
export type TransactionEIP2930Constructor = import("./TransactionEIP2930Constructor.js").TransactionEIP2930Constructor;
import { serialize } from "./serialize.js";
import { getSender } from "./getSender.js";
export const hash: (tx: import("./TransactionEIP2930Type.js").TransactionEIP2930Type) => Uint8Array;
export const getSigningHash: (tx: import("./TransactionEIP2930Type.js").TransactionEIP2930Type) => Uint8Array;
export const verifySignature: (tx: import("./TransactionEIP2930Type.js").TransactionEIP2930Type) => boolean;
import { deserialize } from "./deserialize.js";
import { GetSigningHash } from "./getSigningHash.js";
import { Hash } from "./hash.js";
import { VerifySignature } from "./verifySignature.js";
export { deserialize, GetSigningHash, getSender, Hash, serialize, VerifySignature };
//# sourceMappingURL=EIP2930.d.ts.map