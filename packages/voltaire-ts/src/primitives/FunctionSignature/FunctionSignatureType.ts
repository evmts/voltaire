import type { SelectorType } from "../Selector/SelectorType.js";

export type FunctionSignatureType = {
	readonly selector: SelectorType;
	readonly signature: string;
	readonly name: string;
	readonly inputs: readonly string[];
};

export type FunctionSignatureLike =
	| FunctionSignatureType
	| string
	| SelectorType;
