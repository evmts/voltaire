import { EIP2930 } from "@tevm/voltaire/Transaction";

export type TransactionEIP2930Type = ReturnType<typeof EIP2930.TransactionEIP2930>;

export const TransactionEIP2930 = EIP2930.TransactionEIP2930;
export const deserialize = EIP2930.deserialize;
export const serialize = EIP2930.serialize;
export const hash: (tx: TransactionEIP2930Type) => Uint8Array = EIP2930.hash;
export const getSigningHash: (tx: TransactionEIP2930Type) => Uint8Array = EIP2930.getSigningHash;
export const getSender = EIP2930.getSender;
export const verifySignature: (tx: TransactionEIP2930Type) => boolean = EIP2930.verifySignature;
export const Hash = EIP2930.Hash;
export const GetSigningHash = EIP2930.GetSigningHash;
export const VerifySignature = EIP2930.VerifySignature;

export { EIP2930 };
