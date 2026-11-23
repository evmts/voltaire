import type { AbiType, Item } from "./AbiType.js";
import type * as AbiConstructorNs from "./constructor/index.js";
import type { decodeAbiParameters } from "./decodeAbiParameters.js";
import type {
	DecodeParameters,
	decodeParameters,
	encodeParameters,
	Parameters,
} from "./Encoding.js";
import type * as AbiError from "./error/index.js";
import type * as AbiEvent from "./event/index.js";
import type {
	findSelectorCollisions,
	hasSelectorCollisions,
	SelectorCollision,
} from "./findSelectorCollisions.js";
import type * as AbiFunction from "./function/index.js";
import type * as AbiItem from "./Item/index.js";
import type { Parameter } from "./parameter/index.js";

/**
 * Abi class interface
 *
 * Array-like class for working with contract ABIs, extending Array with ABI-specific methods
 */
export interface Abi<TItems extends readonly Item[] = readonly Item[]>
	extends Array<TItems[number]> {
	// Instance methods for ABI operations
	getItem(name: string, type: "function" | "event" | "error"): Item | undefined;
	format(): string[];
	// biome-ignore lint/suspicious/noExplicitAny: ABI args are dynamically typed based on function signature
	formatWithArgs(args: Record<string, any>): string[];
	// biome-ignore lint/suspicious/noExplicitAny: ABI encoding accepts dynamic argument types
	encode(functionName: string, args: any[]): Uint8Array;
	// biome-ignore lint/suspicious/noExplicitAny: ABI decoding returns dynamic types based on function signature
	decode(functionName: string, data: Uint8Array): any[];
	// biome-ignore lint/suspicious/noExplicitAny: ABI decoding returns dynamic types based on function signature
	decodeData(data: Uint8Array): {
		functionName: string;
		args: readonly unknown[];
	};
	// biome-ignore lint/suspicious/noExplicitAny: Log parsing accepts and returns dynamic types
	parseLogs(logs: readonly any[]): any[];

	// Convenience getters for specific item types
	getFunction(name: string): AbiFunction.FunctionType | undefined;
	getEvent(name: string): import("./event/EventType.js").EventType | undefined;
	getError(name: string): AbiError.ErrorType | undefined;
	getConstructor(): AbiConstructorNs.ConstructorType | undefined;
	// biome-ignore lint/suspicious/noExplicitAny: Fallback function type is not fully typed yet
	getFallback(): any;
	// biome-ignore lint/suspicious/noExplicitAny: Receive function type is not fully typed yet
	getReceive(): any;
	findSelectorCollisions(): SelectorCollision[];
	hasSelectorCollisions(): boolean;
}

/**
 * Abi constructor interface
 */
export interface AbiConstructor {
	/**
	 * Create Abi from JSON ABI items and/or human-readable signatures
	 */
	(items: readonly (Item | string)[]): Abi;

	/**
	 * Create Abi from JSON ABI items and/or human-readable signatures
	 */
	from(items: readonly (Item | string)[]): Abi;

	/**
	 * Parse human-readable signatures into JSON ABI items
	 */
	parseHumanReadable(signatures: readonly (Item | string)[]): Item[];

	// Static utility methods
	getItem(
		abi: AbiType,
		name: string,
		type: "function" | "event" | "error",
	): Item | undefined;
	format(abi: AbiType): string[];
	// biome-ignore lint/suspicious/noExplicitAny: ABI args are dynamically typed based on function signature
	formatWithArgs(abi: AbiType, args: Record<string, any>): string[];
	// biome-ignore lint/suspicious/noExplicitAny: ABI encoding accepts dynamic argument types
	encode(abi: AbiType, functionName: string, args: any[]): Uint8Array;
	// biome-ignore lint/suspicious/noExplicitAny: ABI decoding returns dynamic types based on function signature
	decode(abi: AbiType, functionName: string, data: Uint8Array): any[];
	decodeData(
		abi: AbiType,
		data: Uint8Array,
	): { functionName: string; args: readonly unknown[] };
	// biome-ignore lint/suspicious/noExplicitAny: Log parsing accepts and returns dynamic types
	parseLogs(abi: AbiType, logs: readonly any[]): any[];
	findSelectorCollisions: typeof findSelectorCollisions;
	hasSelectorCollisions: typeof hasSelectorCollisions;

	// Parameter encoding/decoding
	encodeParameters: typeof encodeParameters;
	decodeParameters: typeof decodeParameters;
	decodeAbiParameters: typeof decodeAbiParameters;
	Parameters: typeof Parameters;
	DecodeParameters: typeof DecodeParameters;

	// Sub-namespaces
	Function: typeof AbiFunction;
	Event: typeof AbiEvent;
	Error: typeof AbiError;
	Constructor: typeof AbiConstructorNs;
	Item: typeof AbiItem;
	Parameter: typeof Parameter;

	prototype: Abi;
}
