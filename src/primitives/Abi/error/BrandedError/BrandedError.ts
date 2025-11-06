import type { Parameter } from "../Parameter.js";

export type BrandedError<
	TName extends string = string,
	TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
	type: "error";
	name: TName;
	inputs: TInputs;
};

export type ExtractNames<TAbi extends readonly import("../Item.js").Item[]> =
	Extract<TAbi[number], { type: "error" }>["name"];

export type Get<
	TAbi extends readonly import("../Item.js").Item[],
	TName extends string,
> = Extract<TAbi[number], { type: "error"; name: TName }>;
