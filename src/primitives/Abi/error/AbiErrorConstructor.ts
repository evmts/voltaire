import type { BrandedError } from "./BrandedError/BrandedError.js";
import type { Parameter, ParametersToPrimitiveTypes } from "../Parameter.js";
import { getSelector } from "./BrandedError/getSelector.js";
import { getSignature } from "./BrandedError/getSignature.js";
import { encodeParams } from "./BrandedError/encodeParams.js";
import { decodeParams } from "./BrandedError/decodeParams.js";

type AbiErrorPrototype<
	TName extends string = string,
	TInputs extends readonly Parameter[] = readonly Parameter[],
> = BrandedError<TName, TInputs> & {
	getSelector(
		this: BrandedError<TName, TInputs>,
	): ReturnType<typeof getSelector>;
	getSignature(
		this: BrandedError<TName, TInputs>,
	): ReturnType<typeof getSignature>;
	encodeParams(
		this: BrandedError<TName, TInputs>,
		args: ParametersToPrimitiveTypes<TInputs>,
	): ReturnType<typeof encodeParams>;
	decodeParams(
		this: BrandedError<TName, TInputs>,
		data: Uint8Array,
	): ReturnType<typeof decodeParams>;
};

export interface AbiErrorConstructor {
	<
		TName extends string = string,
		TInputs extends readonly Parameter[] = readonly Parameter[],
	>(
		error: BrandedError<TName, TInputs>,
	): AbiErrorPrototype<TName, TInputs>;
	prototype: AbiErrorPrototype;
	getSelector: typeof getSelector;
	getSignature: typeof getSignature;
	encodeParams: typeof encodeParams;
	decodeParams: typeof decodeParams;
}
