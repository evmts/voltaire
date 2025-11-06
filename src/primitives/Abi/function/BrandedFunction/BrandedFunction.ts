import type { BrandedItem as Item } from "../../Item/index.js";
import type { Parameter } from "../../Parameter.js";
import type { StateMutability } from "../statemutability.js";

/**
 * Function ABI item type
 *
 * @template TName - Function name
 * @template TStateMutability - State mutability (pure | view | nonpayable | payable)
 * @template TInputs - Input parameters
 * @template TOutputs - Output parameters
 */
export type Function<
	TName extends string = string,
	TStateMutability extends StateMutability = StateMutability,
	TInputs extends readonly Parameter[] = readonly Parameter[],
	TOutputs extends readonly Parameter[] = readonly Parameter[],
> = {
	type: "function";
	name: TName;
	stateMutability: TStateMutability;
	inputs: TInputs;
	outputs: TOutputs;
};

/**
 * Extract function names from an ABI
 */
export type ExtractNames<TAbi extends readonly Item[]> = Extract<
	TAbi[number],
	{ type: "function" }
>["name"];

/**
 * Get a specific function from an ABI by name
 */
export type Get<TAbi extends readonly Item[], TName extends string> = Extract<
	TAbi[number],
	{ type: "function"; name: TName }
>;
