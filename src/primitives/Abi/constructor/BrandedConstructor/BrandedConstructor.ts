import type { Parameter } from "../../Parameter.js";
import type { StateMutability } from "../../function/BrandedFunction/statemutability.js";

export type BrandedConstructor<
	TStateMutability extends StateMutability = StateMutability,
	TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
	type: "constructor";
	stateMutability: TStateMutability;
	inputs: TInputs;
};
