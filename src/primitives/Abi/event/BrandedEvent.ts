import type { BrandedHash } from "../../Hash/index.js";
import type { Parameter, ParametersToObject } from "../Parameter.js";

export type Event<
	TName extends string = string,
	TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
	type: "event";
	name: TName;
	inputs: TInputs;
	anonymous?: boolean;
};

export type EncodeTopicsArgs<TInputs extends readonly Parameter[]> = Partial<
	ParametersToObject<TInputs>
>;

export type DecodeLogResult<TInputs extends readonly Parameter[]> =
	ParametersToObject<TInputs>;
