import { Function as FunctionNamespace } from "@tevm/voltaire/Abi";

export const {
	getSelector,
	getSignature,
	encodeParams,
	decodeParams,
	encodeResult,
	decodeResult,
	Signature,
	Params,
	DecodeParams,
	Result,
	DecodeResult,
	GetSelector,
} = FunctionNamespace;

export {
	FunctionDecodingError,
	FunctionEncodingError,
	FunctionInvalidSelectorError,
} from "./errors.js";

export { FunctionNamespace as Function };
