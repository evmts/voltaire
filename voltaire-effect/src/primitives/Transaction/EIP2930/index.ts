import { EIP2930 } from "@tevm/voltaire/Transaction";

export const {
	TransactionEIP2930,
	deserialize,
	serialize,
	hash,
	getSigningHash,
	getSender,
	verifySignature,
	Hash,
	GetSigningHash,
	VerifySignature,
} = EIP2930;

export { EIP2930 };
