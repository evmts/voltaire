import type { Parameter } from "../Parameter.js";
import type { FunctionType } from "./FunctionType.js";
import type { decodeParams } from "./decodeParams.js";
import type { decodeResult } from "./decodeResult.js";
import type { encodeParams } from "./encodeParams.js";
import type { encodeResult } from "./encodeResult.js";
import type { GetSelector } from "./getSelector.js";
import type { getSignature } from "./getSignature.js";
import type { StateMutability } from "./statemutability.js";

/**
 * Function constructor type
 */
export interface FunctionConstructor {
	<
		TName extends string = string,
		TStateMutability extends StateMutability = StateMutability,
		TInputs extends readonly Parameter[] = readonly Parameter[],
		TOutputs extends readonly Parameter[] = readonly Parameter[],
	>(
		fn: FunctionType<TName, TStateMutability, TInputs, TOutputs>,
	): FunctionType<TName, TStateMutability, TInputs, TOutputs>;

	// Static methods
	getSelector: ReturnType<typeof GetSelector>;
	getSignature: typeof getSignature;
	encodeParams: typeof encodeParams;
	decodeParams: typeof decodeParams;
	encodeResult: typeof encodeResult;
	decodeResult: typeof decodeResult;
}
