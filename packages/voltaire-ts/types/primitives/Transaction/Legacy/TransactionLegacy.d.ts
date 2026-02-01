/**
 * @typedef {import('./TransactionLegacyType.js').TransactionLegacyType} TransactionLegacyType
 * @typedef {import('./TransactionLegacyConstructor.js').TransactionLegacyConstructor} TransactionLegacyConstructor
 */
/**
 * Factory function for creating Legacy Transaction instances
 *
 * @type {TransactionLegacyConstructor}
 */
export function TransactionLegacy(tx: any): TransactionLegacyType;
export class TransactionLegacy {
    /**
     * @typedef {import('./TransactionLegacyType.js').TransactionLegacyType} TransactionLegacyType
     * @typedef {import('./TransactionLegacyConstructor.js').TransactionLegacyConstructor} TransactionLegacyConstructor
     */
    /**
     * Factory function for creating Legacy Transaction instances
     *
     * @type {TransactionLegacyConstructor}
     */
    constructor(tx: any);
    serialize: typeof serialize;
    hash: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => Uint8Array;
    getChainId: typeof getChainId;
    getSigningHash: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => Uint8Array;
    getSender: typeof getSender;
    verifySignature: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => boolean;
}
export namespace TransactionLegacy {
    export { deserialize };
    export function serialize(tx: any): Uint8Array<ArrayBufferLike>;
    export function hash(tx: any): Uint8Array<ArrayBufferLike>;
    export function getChainId(tx: any): bigint | null;
    export function getSigningHash(tx: any): Uint8Array<ArrayBufferLike>;
    export function getSender(tx: any): import("../../Address/AddressType.js").AddressType;
    export function verifySignature(tx: any): boolean;
}
export * from "./TransactionLegacyType.js";
export type TransactionLegacyType = import("./TransactionLegacyType.js").TransactionLegacyType;
export type TransactionLegacyConstructor = import("./TransactionLegacyConstructor.js").TransactionLegacyConstructor;
import { serialize } from "./serialize.js";
import { getChainId } from "./getChainId.js";
import { getSender } from "./getSender.js";
import { deserialize } from "./deserialize.js";
import { Hash } from "./hash.js";
import { GetSigningHash } from "./getSigningHash.js";
import { VerifySignature } from "./verifySignature.js";
export const getSigningHash: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => Uint8Array;
export const hash: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => Uint8Array;
export const verifySignature: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => boolean;
export { Hash, GetSigningHash, VerifySignature, deserialize, getChainId, getSender, serialize };
//# sourceMappingURL=TransactionLegacy.d.ts.map