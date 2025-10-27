import type { Hash } from "./hash.ts";

/**
 * ABI type definitions
 */

export type AbiType =
	| "uint8"
	| "uint16"
	| "uint32"
	| "uint64"
	| "uint128"
	| "uint256"
	| "int8"
	| "int16"
	| "int32"
	| "int64"
	| "int128"
	| "int256"
	| "address"
	| "bool"
	| "bytes1"
	| "bytes2"
	| "bytes3"
	| "bytes4"
	| "bytes8"
	| "bytes16"
	| "bytes32"
	| "bytes"
	| "string"
	| "uint256[]"
	| "bytes32[]"
	| "address[]"
	| "string[]";

export type StateMutability = "pure" | "view" | "nonpayable" | "payable";

export interface AbiParameter {
	name: string;
	type: string;
	indexed?: boolean;
	components?: AbiParameter[];
}

export interface AbiFunction {
	type: "function";
	name: string;
	inputs: AbiParameter[];
	outputs: AbiParameter[];
	stateMutability: StateMutability;
}

export interface AbiEvent {
	type: "event";
	name: string;
	inputs: AbiParameter[];
	anonymous?: boolean;
}

export interface AbiError {
	type: "error";
	name: string;
	inputs: AbiParameter[];
}

export interface AbiConstructor {
	type: "constructor";
	inputs: AbiParameter[];
	stateMutability: StateMutability;
}

export interface AbiFallback {
	type: "fallback";
	stateMutability: StateMutability;
}

export interface AbiReceive {
	type: "receive";
	stateMutability: "payable";
}

export type AbiItem =
	| AbiFunction
	| AbiEvent
	| AbiError
	| AbiConstructor
	| AbiFallback
	| AbiReceive;

export type Abi = AbiItem[];

/**
 * Encode function call data
 *
 * @param signature Function signature (e.g., "transfer(address,uint256)")
 * @param args Function arguments
 * @returns Encoded function data (selector + encoded args)
 */
export function encodeFunctionData(
	signature: string,
	args: unknown[],
): Uint8Array {
	throw new Error("encodeFunctionData not implemented");
}

/**
 * Decode function return data
 *
 * @param signature Function signature
 * @param data Encoded return data
 * @returns Decoded return values
 */
export function decodeFunctionResult(
	signature: string,
	data: Uint8Array,
): unknown[] {
	throw new Error("decodeFunctionResult not implemented");
}

/**
 * Encode event topics for indexed parameters
 *
 * @param signature Event signature (e.g., "Transfer(address,address,uint256)")
 * @param args Indexed argument values
 * @returns Array of topic hashes
 */
export function encodeEventTopics(signature: string, args: unknown[]): Hash[] {
	throw new Error("encodeEventTopics not implemented");
}

/**
 * Decode event log data
 *
 * @param signature Event signature
 * @param data Event log data
 * @param topics Event log topics
 * @returns Decoded event parameters
 */
export function decodeEventLog(
	signature: string,
	data: Uint8Array,
	topics: Hash[],
): Record<string, unknown> {
	throw new Error("decodeEventLog not implemented");
}

/**
 * Get function selector from signature
 *
 * @param signature Function signature
 * @returns 4-byte function selector
 */
export function getFunctionSelector(signature: string): Uint8Array {
	throw new Error("getFunctionSelector not implemented");
}

/**
 * Get event selector from signature
 *
 * @param signature Event signature
 * @returns 32-byte event selector (topic0)
 */
export function getEventSelector(signature: string): Hash {
	throw new Error("getEventSelector not implemented");
}

/**
 * Encode ABI parameters
 *
 * @param types Parameter types
 * @param values Parameter values
 * @returns Encoded data
 */
export function encodeParameters(types: string[], values: unknown[]): Uint8Array {
	throw new Error("encodeParameters not implemented");
}

/**
 * Decode ABI parameters
 *
 * @param types Parameter types
 * @param data Encoded data
 * @returns Decoded values
 */
export function decodeParameters(types: string[], data: Uint8Array): unknown[] {
	throw new Error("decodeParameters not implemented");
}
