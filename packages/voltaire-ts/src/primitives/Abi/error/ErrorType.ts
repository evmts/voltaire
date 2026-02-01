import type { AbiParameter as Parameter } from "../parameter/index.js";

export type ErrorType<
	TName extends string = string,
	TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
	type: "error";
	name: TName;
	inputs: TInputs;
};

export type ExtractNames<
	TAbi extends readonly import("../Item/index.js").ItemType[],
> = Extract<TAbi[number], { type: "error" }>["name"];

export type Get<
	TAbi extends readonly import("../Item/index.js").ItemType[],
	TName extends string,
> = Extract<TAbi[number], { type: "error"; name: TName }>;
