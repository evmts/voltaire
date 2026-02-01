/**
 * @typedef {import('./TransactionEIP2930Type.js').TransactionEIP2930Type} TransactionEIP2930Type
 * @typedef {import('./TransactionEIP2930Constructor.js').TransactionEIP2930Constructor} TransactionEIP2930Constructor
 */
/**
 * Factory function for creating EIP-2930 Transaction instances
 *
 * @type {TransactionEIP2930Constructor}
 */
export function TransactionEIP2930(tx: any): TransactionEIP2930Type;
export class TransactionEIP2930 {
    /**
     * @typedef {import('./TransactionEIP2930Type.js').TransactionEIP2930Type} TransactionEIP2930Type
     * @typedef {import('./TransactionEIP2930Constructor.js').TransactionEIP2930Constructor} TransactionEIP2930Constructor
     */
    /**
     * Factory function for creating EIP-2930 Transaction instances
     *
     * @type {TransactionEIP2930Constructor}
     */
    constructor(tx: any);
    serialize: typeof serialize;
    hash: (tx: import("./TransactionEIP2930Type.js").TransactionEIP2930Type) => Uint8Array;
    getSigningHash: (tx: import("./TransactionEIP2930Type.js").TransactionEIP2930Type) => Uint8Array;
    getSender: typeof getSender;
    verifySignature: (tx: import("./TransactionEIP2930Type.js").TransactionEIP2930Type) => boolean;
}
export namespace TransactionEIP2930 {
    export function deserialize(bytes: Uint8Array<ArrayBufferLike>): import("./TransactionEIP2930Type.js").TransactionEIP2930Type;
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
import { Hash } from "./hash.js";
import { GetSigningHash } from "./getSigningHash.js";
import { VerifySignature } from "./verifySignature.js";
import { deserialize } from "./deserialize.js";
export { Hash, GetSigningHash, VerifySignature, deserialize, serialize, getSender };
//# sourceMappingURL=EIP2930.d.ts.map