import { decodeParameters, encodeParameters } from "../Encoding.js";
import type { Parameter, ParametersToPrimitiveTypes } from "../Parameter.js";
import type { StateMutability } from "../function/statemutability.js";

export type Constructor<
	TStateMutability extends StateMutability = StateMutability,
	TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
	type: "constructor";
	stateMutability: TStateMutability;
	inputs: TInputs;
};

export function encodeParams<
	TStateMutability extends StateMutability = StateMutability,
	TInputs extends readonly Parameter[] = readonly Parameter[],
>(
	constructor: Constructor<TStateMutability, TInputs>,
	args: ParametersToPrimitiveTypes<TInputs>,
): Uint8Array {
	return encodeParameters(constructor.inputs, args);
}

export function decodeParams<
	TStateMutability extends StateMutability = StateMutability,
	TInputs extends readonly Parameter[] = readonly Parameter[],
>(
	constructor: Constructor<TStateMutability, TInputs>,
	data: Uint8Array,
): ParametersToPrimitiveTypes<TInputs> {
	return decodeParameters(
		constructor.inputs,
		data,
	) as ParametersToPrimitiveTypes<TInputs>;
}
