import { Legacy } from "@tevm/voltaire/Transaction";

export const {
	TransactionLegacy,
	deserialize,
	serialize,
	hash,
	getChainId,
	getSigningHash,
	getSender,
	verifySignature,
	Hash,
	GetSigningHash,
	VerifySignature,
} = Legacy;

export { Legacy };
