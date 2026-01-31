/**
 * @fileoverview Abi module for encoding and decoding Ethereum ABI data.
 * Provides Effect-based wrappers around voltaire's ABI utilities with
 * type-safe error handling through Effect's error channel.
 *
 * @module Abi
 * @since 0.0.1
 */

export {
	AbiSchema,
	AbiTypeSchema,
	ConstructorSchema,
	ErrorSchema,
	EventSchema,
	FallbackSchema,
	FunctionSchema,
	fromArray,
	ItemSchema,
	ParameterSchema,
	ReceiveSchema,
	StateMutabilitySchema,
} from "./AbiSchema.js";

// Core encoding
export { encode } from "./encode.js";
export { encodePacked } from "./encodePacked.js";
export { encodeWrappedError, type WrappedErrorInput } from "./encodeWrappedError.js";

// Core decoding
export { decode } from "./decode.js";
export { decodeData } from "./decodeData.js";
export { decodeLog, type LogInput } from "./decodeLog.js";
export { decodeWrappedError, type WrappedErrorResult } from "./decodeWrappedError.js";

// Error encoding/decoding
export { decodeError } from "./decodeError.js";
export { encodeError } from "./encodeError.js";

// Event encoding/decoding
export { decodeEventLog } from "./decodeEventLog.js";
export { encodeEventLog } from "./encodeEventLog.js";

// Function encoding/decoding
export { decodeFunction } from "./decodeFunction.js";
export { decodeFunctionData } from "./decodeFunctionData.js";
export { decodeFunctionResult } from "./decodeFunctionResult.js";
export { encodeFunction } from "./encodeFunction.js";
export { encodeFunctionData } from "./encodeFunctionData.js";
export { encodeFunctionResult } from "./encodeFunctionResult.js";

// Lookup functions
export { findError } from "./findError.js";
export { findEvent } from "./findEvent.js";
export { findFunction } from "./findFunction.js";

// Selector collision detection
export {
	findSelectorCollisions,
	hasSelectorCollisions,
	type SelectorCollision,
} from "./findSelectorCollisions.js";

// Formatting
export { format } from "./format.js";
export { formatWithArgs } from "./formatWithArgs.js";

// Getters
export { getErrorSignature } from "./getErrorSignature.js";
export { getEvent } from "./getEvent.js";
export { getEventSignature } from "./getEventSignature.js";
export { getFunction } from "./getFunction.js";
export { getFunctionSignature } from "./getFunctionSignature.js";
export { getSelector } from "./getSelector.js";

// Parsing
export { AbiParseError, parse } from "./parse.js";
export { AbiItemParseError, parseItem } from "./parseItem.js";
export { parseLogs, type ParsedLog, type ParseLogsInput } from "./parseLogs.js";

// Bytecode analysis
export { AbiBytecodeError, fromBytecode, type RecoveredAbiItem } from "./fromBytecode.js";
