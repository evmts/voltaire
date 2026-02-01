import { EIP7702 } from "@tevm/voltaire/Transaction";

export const {
	TransactionEIP7702,
	deserialize,
	serialize,
	hash,
	getSigningHash,
	getSender,
	verifySignature,
	getEffectiveGasPrice,
	Hash,
	GetSigningHash,
	VerifySignature,
} = EIP7702;

export { EIP7702 };
