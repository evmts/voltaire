import { EIP7702 } from "@tevm/voltaire/Transaction";

export type TransactionEIP7702Type = ReturnType<typeof EIP7702.TransactionEIP7702>;

export const TransactionEIP7702 = EIP7702.TransactionEIP7702;
export const deserialize = EIP7702.deserialize;
export const serialize = EIP7702.serialize;
export const hash: (tx: TransactionEIP7702Type) => Uint8Array = EIP7702.hash;
export const getSigningHash: (tx: TransactionEIP7702Type) => Uint8Array = EIP7702.getSigningHash;
export const getSender = EIP7702.getSender;
export const verifySignature: (tx: TransactionEIP7702Type) => boolean = EIP7702.verifySignature;
export const getEffectiveGasPrice = EIP7702.getEffectiveGasPrice;
export const Hash = EIP7702.Hash;
export const GetSigningHash = EIP7702.GetSigningHash;
export const VerifySignature = EIP7702.VerifySignature;

export { EIP7702 };
