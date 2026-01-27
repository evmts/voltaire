import { EIP1559 } from "@tevm/voltaire/Transaction";

export const {
	TransactionEIP1559,
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
} = EIP1559;

export { EIP1559 };
