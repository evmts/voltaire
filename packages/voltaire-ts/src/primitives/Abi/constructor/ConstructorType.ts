import type { StateMutability } from "../function/statemutability.js";
import type { Parameter, ParametersToPrimitiveTypes } from "../Parameter.js";

/**
 * Type definition for Constructor (data only)
 */
export type ConstructorType<
	TStateMutability extends StateMutability = StateMutability,
	TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
	type: "constructor";
	stateMutability: TStateMutability;
	inputs: TInputs;
};

/**
 * Constructor instance with methods (returned by Constructor factory)
 */
export interface ConstructorInstance<
	TStateMutability extends StateMutability = StateMutability,
	TInputs extends readonly Parameter[] = readonly Parameter[],
> extends ConstructorType<TStateMutability, TInputs> {
	encodeParams(args: ParametersToPrimitiveTypes<TInputs>): Uint8Array;
	decodeParams(data: Uint8Array): ParametersToPrimitiveTypes<TInputs>;
}
