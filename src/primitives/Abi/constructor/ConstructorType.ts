import type { Parameter } from "../Parameter.js";
import type { StateMutability } from "../function/BrandedFunction/statemutability.js";
import type { BrandedConstructor } from "./BrandedConstructor/BrandedConstructor.js";

/**
 * Type definition for Constructor class instances
 * Extends BrandedConstructor with instance methods
 */
export type ConstructorType<
	TStateMutability extends StateMutability = StateMutability,
	TInputs extends readonly Parameter[] = readonly Parameter[],
> = BrandedConstructor<TStateMutability, TInputs> & {
	encodeParams(args: any[]): Uint8Array;
	decodeParams(data: Uint8Array): any[];
};
