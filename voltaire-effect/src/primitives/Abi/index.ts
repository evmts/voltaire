/**
 * @fileoverview Abi module for encoding and decoding Ethereum ABI data.
 * Provides Effect-based wrappers around voltaire's ABI utilities with
 * type-safe error handling through Effect's error channel.
 *
 * @module Abi
 * @since 0.0.1
 */

// Parsing
export { parse, AbiParseError } from './parse.js'
export { parseItem, AbiItemParseError } from './parseItem.js'

// Function encoding/decoding
export { encodeFunction } from './encodeFunction.js'
export { decodeFunction } from './decodeFunction.js'
export { encodeFunctionData } from './encodeFunctionData.js'
export { decodeFunctionData } from './decodeFunctionData.js'
export { encodeFunctionResult } from './encodeFunctionResult.js'
export { decodeFunctionResult } from './decodeFunctionResult.js'

// Event encoding/decoding
export { encodeEventLog } from './encodeEventLog.js'
export { decodeEventLog } from './decodeEventLog.js'

// Error encoding/decoding
export { encodeError } from './encodeError.js'
export { decodeError } from './decodeError.js'

// Selectors and signatures
export { getSelector } from './getSelector.js'
export { getEventSignature } from './getEventSignature.js'
export { getFunctionSignature } from './getFunctionSignature.js'
export { getErrorSignature } from './getErrorSignature.js'

// Lookup functions
export { findFunction } from './findFunction.js'
export { findEvent } from './findEvent.js'
export { findError } from './findError.js'
export { getFunction } from './getFunction.js'
export { getEvent } from './getEvent.js'

// Formatting
export { format } from './format.js'
export { formatWithArgs } from './formatWithArgs.js'
