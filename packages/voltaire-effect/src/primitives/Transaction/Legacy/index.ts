import { Legacy } from "@tevm/voltaire/Transaction";

export type TransactionLegacyType = ReturnType<typeof Legacy.TransactionLegacy>;

export const TransactionLegacy = Legacy.TransactionLegacy;
export const deserialize = Legacy.deserialize;
export const serialize = Legacy.serialize;
export const hash: (this: TransactionLegacyType) => Uint8Array = Legacy.hash;
export const getChainId = Legacy.getChainId;
export const getSigningHash: (this: TransactionLegacyType) => Uint8Array = Legacy.getSigningHash;
export const getSender = Legacy.getSender;
export const verifySignature: (this: TransactionLegacyType) => boolean = Legacy.verifySignature;
export const Hash = Legacy.Hash;
export const GetSigningHash = Legacy.GetSigningHash;
export const VerifySignature = Legacy.VerifySignature;

export { Legacy };
