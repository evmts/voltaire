/**
 * @typedef {import('./TransactionLegacyType.js').TransactionLegacyType} TransactionLegacyType
 * @typedef {import('./TransactionLegacyConstructor.js').TransactionLegacyConstructor} TransactionLegacyConstructor
 */
/**
 * Factory function for creating Legacy Transaction instances
 *
 * @type {TransactionLegacyConstructor}
 * @param {Parameters<TransactionLegacyConstructor>[0]} tx
 */
export function TransactionLegacy(tx: Parameters<TransactionLegacyConstructor>[0]): TransactionLegacyType;
export class TransactionLegacy {
    /**
     * @typedef {import('./TransactionLegacyType.js').TransactionLegacyType} TransactionLegacyType
     * @typedef {import('./TransactionLegacyConstructor.js').TransactionLegacyConstructor} TransactionLegacyConstructor
     */
    /**
     * Factory function for creating Legacy Transaction instances
     *
     * @type {TransactionLegacyConstructor}
     * @param {Parameters<TransactionLegacyConstructor>[0]} tx
     */
    constructor(tx: Parameters<TransactionLegacyConstructor>[0]);
    serialize: (tx: import("./TransactionLegacyType.js").TransactionLegacyType) => ReturnType<typeof serialize>;
    hash: (tx: import("./TransactionLegacyType.js").TransactionLegacyType) => ReturnType<typeof import("./hash.js").hash>;
    getChainId: (tx: import("./TransactionLegacyType.js").TransactionLegacyType) => ReturnType<typeof getChainId>;
    getSigningHash: (tx: import("./TransactionLegacyType.js").TransactionLegacyType) => ReturnType<typeof import("./getSigningHash.js").getSigningHash>;
    getSender: (tx: import("./TransactionLegacyType.js").TransactionLegacyType) => ReturnType<typeof getSender>;
    verifySignature: (tx: import("./TransactionLegacyType.js").TransactionLegacyType) => ReturnType<typeof import("./verifySignature.js").verifySignature>;
}
export namespace TransactionLegacy {
    let deserialize: (bytes: Uint8Array) => import("./TransactionLegacyType.js").TransactionLegacyType & {
        serialize: typeof import("./serialize.js").serialize;
        hash: typeof import("./hash.js").hash;
        getChainId: typeof import("./getChainId.js").getChainId;
        getSigningHash: typeof import("./getSigningHash.js").getSigningHash;
        getSender: typeof import("./getSender.js").getSender;
        verifySignature: typeof import("./verifySignature.js").verifySignature;
    };
    function serialize(tx: TransactionLegacyType): Uint8Array<ArrayBufferLike>;
    function hash(tx: TransactionLegacyType): Uint8Array<ArrayBufferLike>;
    function getChainId(tx: TransactionLegacyType): bigint | null;
    function getSigningHash(tx: TransactionLegacyType): Uint8Array<ArrayBufferLike>;
    function getSender(tx: TransactionLegacyType): import("../../Address/AddressType.js").AddressType;
    function verifySignature(tx: TransactionLegacyType): boolean;
}
export * from "./TransactionLegacyType.js";
export type TransactionLegacyType = import("./TransactionLegacyType.js").TransactionLegacyType;
export type TransactionLegacyConstructor = import("./TransactionLegacyConstructor.js").TransactionLegacyConstructor;
import { serialize } from "./serialize.js";
import { getChainId } from "./getChainId.js";
import { getSender } from "./getSender.js";
import { deserialize } from "./deserialize.js";
import { GetSigningHash } from "./getSigningHash.js";
export const getSigningHash: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => Uint8Array;
import { Hash } from "./hash.js";
export const hash: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => Uint8Array;
import { VerifySignature } from "./verifySignature.js";
export const verifySignature: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => boolean;
export { deserialize, GetSigningHash, getChainId, getSender, Hash, serialize, VerifySignature };
//# sourceMappingURL=TransactionLegacy.d.ts.map