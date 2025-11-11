import type { Parameter } from "../Parameter.js";
import type { Function as BrandedFunction } from "./BrandedFunction/BrandedFunction.js";
import type { decodeParams } from "./BrandedFunction/decodeParams.js";
import type { decodeResult } from "./BrandedFunction/decodeResult.js";
import type { encodeParams } from "./BrandedFunction/encodeParams.js";
import type { encodeResult } from "./BrandedFunction/encodeResult.js";
import type { getSelector } from "./BrandedFunction/getSelector.js";
import type { getSignature } from "./BrandedFunction/getSignature.js";
import type { StateMutability } from "./BrandedFunction/statemutability.js";

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
		fn: BrandedFunction<TName, TStateMutability, TInputs, TOutputs>,
	): BrandedFunction<TName, TStateMutability, TInputs, TOutputs>;

	// Static methods
	getSelector: typeof getSelector;
	getSignature: typeof getSignature;
	encodeParams: typeof encodeParams;
	decodeParams: typeof decodeParams;
	encodeResult: typeof encodeResult;
	decodeResult: typeof decodeResult;
}
