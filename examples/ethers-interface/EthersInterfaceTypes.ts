/**
 * TypeScript type definitions for ethers Interface abstraction
 */

import type { Parameter } from "@tevm/voltaire";

// =============================================================================
// Format Types
// =============================================================================

export type FormatType = "sighash" | "minimal" | "full" | "json";

// =============================================================================
// ABI Item Types
// =============================================================================

export interface AbiFunction {
	readonly type: "function";
	readonly name: string;
	readonly inputs: readonly Parameter[];
	readonly outputs?: readonly Parameter[];
	readonly stateMutability?: "pure" | "view" | "nonpayable" | "payable";
	readonly constant?: boolean;
	readonly payable?: boolean;
	readonly gas?: string | number | bigint;
}

export interface AbiEvent {
	readonly type: "event";
	readonly name: string;
	readonly inputs: readonly (Parameter & { indexed?: boolean })[];
	readonly anonymous?: boolean;
}

export interface AbiError {
	readonly type: "error";
	readonly name: string;
	readonly inputs: readonly Parameter[];
}

export interface AbiConstructor {
	readonly type: "constructor";
	readonly inputs: readonly Parameter[];
	readonly stateMutability?: "nonpayable" | "payable";
	readonly payable?: boolean;
	readonly gas?: string | number | bigint;
}

export interface AbiFallback {
	readonly type: "fallback";
	readonly stateMutability?: "nonpayable" | "payable";
}

export interface AbiReceive {
	readonly type: "receive";
	readonly stateMutability?: "payable";
}

export type AbiItem =
	| AbiFunction
	| AbiEvent
	| AbiError
	| AbiConstructor
	| AbiFallback
	| AbiReceive;

export type InterfaceAbi = readonly AbiItem[] | string;

// =============================================================================
// Fragment Types
// =============================================================================

export interface IParamType {
	readonly name: string;
	readonly type: string;
	readonly baseType: string;
	readonly indexed: boolean | null;
	readonly components: readonly IParamType[] | null;
	readonly arrayLength: number | null;
	readonly arrayChildren: IParamType | null;

	format(format?: FormatType): string;
	isArray(): boolean;
	isTuple(): boolean;
	isIndexable(): boolean;
}

export interface IFragment {
	readonly type:
		| "constructor"
		| "function"
		| "event"
		| "error"
		| "fallback"
		| "receive";
	readonly inputs: readonly IParamType[];
}

export interface INamedFragment extends IFragment {
	readonly name: string;
}

export interface IFunctionFragment extends INamedFragment {
	readonly type: "function";
	readonly constant: boolean;
	readonly outputs: readonly IParamType[];
	readonly stateMutability: "pure" | "view" | "nonpayable" | "payable";
	readonly payable: boolean;
	readonly gas: bigint | null;
	readonly selector: string;

	format(format?: FormatType): string;
}

export interface IEventFragment extends INamedFragment {
	readonly type: "event";
	readonly anonymous: boolean;
	readonly topicHash: string;

	format(format?: FormatType): string;
}

export interface IErrorFragment extends INamedFragment {
	readonly type: "error";
	readonly selector: string;

	format(format?: FormatType): string;
}

export interface IConstructorFragment extends IFragment {
	readonly type: "constructor";
	readonly payable: boolean;
	readonly gas: bigint | null;

	format(format?: FormatType): string;
}

export interface IFallbackFragment extends IFragment {
	readonly type: "fallback" | "receive";
	readonly payable: boolean;

	format(format?: FormatType): string;
}

// =============================================================================
// Description Types
// =============================================================================

export interface ILogDescription {
	readonly fragment: IEventFragment;
	readonly name: string;
	readonly signature: string;
	readonly topic: string;
	readonly args: readonly unknown[];
}

export interface ITransactionDescription {
	readonly fragment: IFunctionFragment;
	readonly name: string;
	readonly args: readonly unknown[];
	readonly signature: string;
	readonly selector: string;
	readonly value: bigint;
}

export interface IErrorDescription {
	readonly fragment: IErrorFragment;
	readonly name: string;
	readonly args: readonly unknown[];
	readonly signature: string;
	readonly selector: string;
}

export interface IIndexed {
	readonly hash: string | null;
	readonly _isIndexed: true;
}

// =============================================================================
// Interface Types
// =============================================================================

export interface Log {
	readonly topics: readonly string[];
	readonly data: string;
}

export interface TransactionLike {
	readonly data: string;
	readonly value?: bigint | string | number;
}

export interface IInterface {
	readonly fragments: readonly IFragment[];
	readonly deploy: IConstructorFragment;
	readonly fallback: IFallbackFragment | null;
	readonly receive: boolean;

	// Format
	format(minimal?: boolean): string[];
	formatJson(): string;

	// Function lookups
	getFunction(
		key: string,
		values?: readonly unknown[],
	): IFunctionFragment | null;
	getFunctionName(key: string): string;
	hasFunction(key: string): boolean;
	forEachFunction(
		callback: (fragment: IFunctionFragment, index: number) => void,
	): void;

	// Event lookups
	getEvent(key: string, values?: readonly unknown[]): IEventFragment | null;
	getEventName(key: string): string;
	hasEvent(key: string): boolean;
	forEachEvent(
		callback: (fragment: IEventFragment, index: number) => void,
	): void;

	// Error lookups
	getError(key: string, values?: readonly unknown[]): IErrorFragment | null;
	forEachError(
		callback: (fragment: IErrorFragment, index: number) => void,
	): void;

	// Function encoding/decoding
	encodeFunctionData(
		fragment: string | IFunctionFragment,
		values?: readonly unknown[],
	): string;
	decodeFunctionData(
		fragment: string | IFunctionFragment,
		data: string,
	): readonly unknown[];
	decodeFunctionResult(
		fragment: string | IFunctionFragment,
		data: string,
	): readonly unknown[];
	encodeFunctionResult(
		fragment: string | IFunctionFragment,
		values?: readonly unknown[],
	): string;

	// Event encoding/decoding
	encodeEventLog(
		fragment: string | IEventFragment,
		values: readonly unknown[],
	): { data: string; topics: string[] };
	decodeEventLog(
		fragment: string | IEventFragment,
		data: string,
		topics?: readonly string[],
	): readonly unknown[];
	encodeFilterTopics(
		fragment: string | IEventFragment,
		values: readonly unknown[],
	): Array<string | null | Array<string | null>>;

	// Error encoding/decoding
	encodeErrorResult(
		fragment: string | IErrorFragment,
		values?: readonly unknown[],
	): string;
	decodeErrorResult(
		fragment: string | IErrorFragment,
		data: string,
	): readonly unknown[];

	// Constructor encoding
	encodeDeploy(values?: readonly unknown[]): string;

	// Parsing
	parseTransaction(tx: TransactionLike): ITransactionDescription | null;
	parseLog(log: Log): ILogDescription | null;
	parseError(data: string): IErrorDescription | null;
}
