import { EIP4844 } from "@tevm/voltaire/Transaction";

export type TransactionEIP4844Type = ReturnType<typeof EIP4844.TransactionEIP4844>;

export const TransactionEIP4844 = EIP4844.TransactionEIP4844;
export const deserialize = EIP4844.deserialize;
export const serialize = EIP4844.serialize;
export const hash: (tx: TransactionEIP4844Type) => Uint8Array = EIP4844.hash;
export const getSigningHash: (tx: TransactionEIP4844Type) => Uint8Array = EIP4844.getSigningHash;
export const getSender = EIP4844.getSender;
export const verifySignature: (tx: TransactionEIP4844Type) => boolean = EIP4844.verifySignature;
export const getEffectiveGasPrice = EIP4844.getEffectiveGasPrice;
export const getBlobGasCost = EIP4844.getBlobGasCost;
export const Hash = EIP4844.Hash;
export const GetSigningHash = EIP4844.GetSigningHash;
export const VerifySignature = EIP4844.VerifySignature;

export { EIP4844 };
