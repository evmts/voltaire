import type { Parameter } from "../Parameter.js";
import type { StateMutability } from "../function/statemutability.js";

/**
 * Type definition for Constructor
 */
export type ConstructorType<
	TStateMutability extends StateMutability = StateMutability,
	TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
	type: "constructor";
	stateMutability: TStateMutability;
	inputs: TInputs;
};
