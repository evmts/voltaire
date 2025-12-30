import type { AbiType, Item } from "./AbiType.js";
import type * as AbiConstructorNs from "./constructor/index.js";
import type * as AbiError from "./error/index.js";
import type * as AbiEvent from "./event/index.js";
import type * as AbiFunction from "./function/index.js";

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
	decodeData(data: Uint8Array): { item: Item; decoded: any[] };
	// biome-ignore lint/suspicious/noExplicitAny: Log parsing accepts and returns dynamic types
	parseLogs(logs: any[]): any[];

	// Convenience getters for specific item types
	getFunction(name: string): AbiFunction.FunctionType | undefined;
	getEvent(name: string): import("./event/EventType.js").EventType | undefined;
	getError(name: string): AbiError.ErrorType | undefined;
	getConstructor(): AbiConstructorNs.ConstructorType | undefined;
	// biome-ignore lint/suspicious/noExplicitAny: Fallback function type is not fully typed yet
	getFallback(): any;
	// biome-ignore lint/suspicious/noExplicitAny: Receive function type is not fully typed yet
	getReceive(): any;
}

/**
 * Abi constructor interface
 */
export interface AbiConstructor {
	/**
	 * Create Abi from items array
	 */
	(items: readonly Item[]): Abi;

	/**
	 * Create Abi from items array
	 */
	from(items: readonly Item[]): Abi;

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
	// biome-ignore lint/suspicious/noExplicitAny: ABI decoding returns dynamic types based on function signature
	decodeData(abi: AbiType, data: Uint8Array): { item: Item; decoded: any[] };
	// biome-ignore lint/suspicious/noExplicitAny: Log parsing accepts and returns dynamic types
	parseLogs(abi: AbiType, logs: any[]): any[];

	// Sub-namespaces
	Function: typeof AbiFunction;
	Event: typeof AbiEvent;
	Error: typeof AbiError;
	Constructor: typeof AbiConstructorNs;

	prototype: Abi;
}
