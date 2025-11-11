import type { BrandedAbi, Item } from "./BrandedAbi/BrandedAbi.js";
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
	formatWithArgs(args: Record<string, any>): string[];
	encode(functionName: string, args: any[]): Uint8Array;
	decode(functionName: string, data: Uint8Array): any[];
	decodeData(data: Uint8Array): { item: Item; decoded: any[] };
	parseLogs(logs: any[]): any[];

	// Convenience getters for specific item types
	getFunction(name: string): AbiFunction.BrandedFunction | undefined;
	getEvent(
		name: string,
	): import("./event/BrandedEvent/BrandedEvent.js").Event | undefined;
	getError(name: string): AbiError.BrandedError | undefined;
	getConstructor(): AbiConstructorNs.BrandedConstructor | undefined;
	getFallback(): any;
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
		abi: BrandedAbi,
		name: string,
		type: "function" | "event" | "error",
	): Item | undefined;
	format(abi: BrandedAbi): string[];
	formatWithArgs(abi: BrandedAbi, args: Record<string, any>): string[];
	encode(abi: BrandedAbi, functionName: string, args: any[]): Uint8Array;
	decode(abi: BrandedAbi, functionName: string, data: Uint8Array): any[];
	decodeData(abi: BrandedAbi, data: Uint8Array): { item: Item; decoded: any[] };
	parseLogs(abi: BrandedAbi, logs: any[]): any[];

	// Sub-namespaces
	Function: typeof AbiFunction;
	Event: typeof AbiEvent;
	Error: typeof AbiError;
	Constructor: typeof AbiConstructorNs;

	prototype: Abi;
}
