import { AbiError, Error as ErrorNamespace } from "@tevm/voltaire/Abi";

export const {
	getSignature,
	getSelector,
	encodeParams,
	decodeParams,
	GetSelector,
} = ErrorNamespace;

export { AbiError, ErrorNamespace as Error };
