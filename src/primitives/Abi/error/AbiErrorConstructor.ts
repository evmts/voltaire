import type { ParametersToPrimitiveTypes } from "../Parameter.js";
import type { BrandedParameter } from "../parameter/index.js";
import type { BrandedError } from "./BrandedError/BrandedError.js";
import type { decodeParams } from "./BrandedError/decodeParams.js";
import type { encodeParams } from "./BrandedError/encodeParams.js";
import type { getSelector } from "./BrandedError/getSelector.js";
import type { getSignature } from "./BrandedError/getSignature.js";

type AbiErrorPrototype<
	TName extends string = string,
	TInputs extends readonly BrandedParameter[] = readonly BrandedParameter[],
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
		TInputs extends readonly BrandedParameter[] = readonly BrandedParameter[],
	>(
		error: BrandedError<TName, TInputs>,
	): AbiErrorPrototype<TName, TInputs>;
	prototype: AbiErrorPrototype;
	getSelector: typeof getSelector;
	getSignature: typeof getSignature;
	encodeParams: typeof encodeParams;
	decodeParams: typeof decodeParams;
}
