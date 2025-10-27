/**
 * ABI encoding and decoding utilities
 * Low-level ABI encoding/decoding for Ethereum function calls, events, and errors
 */

export type Hex = `0x${string}`;
export type AbiParameter = {
	type: string;
	name?: string;
	components?: AbiParameter[];
	indexed?: boolean;
};

/**
 * Decode function result from bytes
 * @param abi - Function ABI definition
 * @param data - Encoded result data
 * @returns Decoded result values
 */
export function decodeFunctionResult(abi: AbiParameter[], data: Hex): unknown[] {
	throw new Error("not implemented");
}

/**
 * Decode function parameters from calldata
 * @param abi - Function ABI definition
 * @param data - Encoded calldata (with 4-byte selector)
 * @returns Decoded parameter values
 */
export function decodeFunctionData(abi: AbiParameter[], data: Hex): unknown[] {
	throw new Error("not implemented");
}

/**
 * Encode function call with parameters
 * @param abi - Function ABI definition
 * @param args - Function arguments
 * @returns Encoded calldata with 4-byte selector
 */
export function encodeFunctionData(abi: AbiParameter[], args: unknown[]): Hex {
	throw new Error("not implemented");
}

/**
 * Encode function result
 * @param abi - Function ABI definition
 * @param values - Return values to encode
 * @returns Encoded result data
 */
export function encodeFunctionResult(abi: AbiParameter[], values: unknown[]): Hex {
	throw new Error("not implemented");
}

/**
 * Decode event log data and topics
 * @param abi - Event ABI definition
 * @param data - Log data field
 * @param topics - Log topics array
 * @returns Decoded event parameters
 */
export function decodeEventLog(
	abi: AbiParameter[],
	data: Hex,
	topics: Hex[],
): Record<string, unknown> {
	throw new Error("not implemented");
}

/**
 * Encode event topics for filtering
 * @param abi - Event ABI definition
 * @param args - Event parameter values (null for wildcard)
 * @returns Encoded topics array
 */
export function encodeEventTopics(abi: AbiParameter[], args: (unknown | null)[]): Hex[] {
	throw new Error("not implemented");
}

/**
 * Decode error data
 * @param abi - Error ABI definition
 * @param data - Encoded error data (with 4-byte selector)
 * @returns Decoded error parameters
 */
export function decodeErrorResult(abi: AbiParameter[], data: Hex): unknown[] {
	throw new Error("not implemented");
}

/**
 * Encode error with parameters
 * @param abi - Error ABI definition
 * @param args - Error arguments
 * @returns Encoded error data with 4-byte selector
 */
export function encodeErrorResult(abi: AbiParameter[], args: unknown[]): Hex {
	throw new Error("not implemented");
}

/**
 * Get 4-byte function selector from signature
 * @param signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns 4-byte selector as hex
 */
export function getFunctionSelector(signature: string): Hex {
	throw new Error("not implemented");
}

/**
 * Get event topic hash from signature
 * @param signature - Event signature (e.g., "Transfer(address,address,uint256)")
 * @returns 32-byte topic hash
 */
export function getEventSelector(signature: string): Hex {
	throw new Error("not implemented");
}

/**
 * Get error selector from signature
 * @param signature - Error signature (e.g., "InsufficientBalance(uint256,uint256)")
 * @returns 4-byte error selector as hex
 */
export function getErrorSelector(signature: string): Hex {
	throw new Error("not implemented");
}

/**
 * Encode packed arguments (Solidity-style)
 * Used for generating signatures without standard ABI encoding padding
 * @param types - Parameter types
 * @param values - Values to encode
 * @returns Packed encoded data
 */
export function encodePacked(types: string[], values: unknown[]): Hex {
	throw new Error("not implemented");
}

/**
 * Decode ABI-encoded parameters
 * @param types - Parameter types
 * @param data - Encoded data
 * @returns Decoded values
 */
export function decodeAbiParameters(types: AbiParameter[], data: Hex): unknown[] {
	throw new Error("not implemented");
}

/**
 * Encode parameters using ABI encoding
 * @param types - Parameter types
 * @param values - Values to encode
 * @returns ABI-encoded data
 */
export function encodeAbiParameters(types: AbiParameter[], values: unknown[]): Hex {
	throw new Error("not implemented");
}
