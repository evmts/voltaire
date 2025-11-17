import type { ParametersToPrimitiveTypes } from "../Parameter.js";
import type { ParameterType } from "../parameter/index.js";
import type { ErrorType } from "./ErrorType.js";
import type { decodeParams } from "./decodeParams.js";
import type { encodeParams } from "./encodeParams.js";
import type { getSignature } from "./getSignature.js";
import type { getSelector } from "./index.js";

type AbiErrorPrototype<
	TName extends string = string,
	TInputs extends readonly ParameterType[] = readonly ParameterType[],
> = ErrorType<TName, TInputs> & {
	getSelector(this: ErrorType<TName, TInputs>): ReturnType<typeof getSelector>;
	getSignature(
		this: ErrorType<TName, TInputs>,
	): ReturnType<typeof getSignature>;
	encodeParams(
		this: ErrorType<TName, TInputs>,
		args: ParametersToPrimitiveTypes<TInputs>,
	): ReturnType<typeof encodeParams>;
	decodeParams(
		this: ErrorType<TName, TInputs>,
		data: Uint8Array,
	): ReturnType<typeof decodeParams>;
};

export interface AbiErrorConstructor {
	<
		TName extends string = string,
		TInputs extends readonly ParameterType[] = readonly ParameterType[],
	>(
		error: ErrorType<TName, TInputs>,
	): AbiErrorPrototype<TName, TInputs>;
	prototype: AbiErrorPrototype;
	getSelector: typeof getSelector;
	getSignature: typeof getSignature;
	encodeParams: typeof encodeParams;
	decodeParams: typeof decodeParams;
}
