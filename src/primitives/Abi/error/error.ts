import * as Hash from "../../Hash/index.js";
import { decodeParameters, encodeParameters } from "../Encoding.js";
import { AbiDecodingError, AbiInvalidSelectorError } from "../Errors.js";
import type { Item } from "../Item.js";
import type { Parameter, ParametersToPrimitiveTypes } from "../Parameter.js";

export type Error<
	TName extends string = string,
	TInputs extends readonly Parameter[] = readonly Parameter[],
> = {
	type: "error";
	name: TName;
	inputs: TInputs;
};

export function getSelector<
	TName extends string = string,
	TInputs extends readonly Parameter[] = readonly Parameter[],
>(this: Error<TName, TInputs>): Uint8Array {
	const signature = getSignature.call(this);
	const hash = Hash.keccak256String(signature);
	return hash.slice(0, 4);
}

export function getSignature<
	TName extends string = string,
	TInputs extends readonly Parameter[] = readonly Parameter[],
>(this: Error<TName, TInputs>): string {
	const inputs = this.inputs.map((p) => p.type).join(",");
	return `${this.name}(${inputs})`;
}

export function encodeParams<
	TName extends string = string,
	TInputs extends readonly Parameter[] = readonly Parameter[],
>(
	this: Error<TName, TInputs>,
	args: ParametersToPrimitiveTypes<TInputs>,
): Uint8Array {
	const selector = getSelector.call(this);
	const encoded = encodeParameters(this.inputs, args);
	const result = new Uint8Array(selector.length + encoded.length);
	result.set(selector, 0);
	result.set(encoded, selector.length);
	return result;
}

export function decodeParams<
	TName extends string = string,
	TInputs extends readonly Parameter[] = readonly Parameter[],
>(
	this: Error<TName, TInputs>,
	data: Uint8Array,
): ParametersToPrimitiveTypes<TInputs> {
	if (data.length < 4) {
		throw new AbiDecodingError("Data too short for error selector");
	}
	const selector = data.slice(0, 4);
	const expectedSelector = getSelector.call(this);
	for (let i = 0; i < 4; i++) {
		const selByte = selector[i];
		const expByte = expectedSelector[i];
		if (selByte !== expByte) {
			throw new AbiInvalidSelectorError("Error selector mismatch");
		}
	}
	return decodeParameters(this.inputs, data.slice(4)) as any;
}

export type ExtractNames<TAbi extends readonly Item[]> = Extract<
	TAbi[number],
	{ type: "error" }
>["name"];

export type Get<TAbi extends readonly Item[], TName extends string> = Extract<
	TAbi[number],
	{ type: "error"; name: TName }
>;
