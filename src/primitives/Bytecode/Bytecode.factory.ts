/**
 * EVM Bytecode Types and Utilities
 *
 * Complete bytecode analysis, validation, and manipulation with type safety.
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { Bytecode } from './Bytecode.js';
 *
 * // Factory function
 * const code = Bytecode('0x6001');
 *
 * // Static methods
 * const analysis = Bytecode.analyze(code);
 * const valid = Bytecode.validate(code);
 *
 * // Instance methods
 * const analysis2 = code.analyze();
 * const valid2 = code.validate();
 * ```
 */

// Import types
import type { BytecodeConstructor } from "./BytecodeConstructor.js";

// Import all method functions
import { analyze } from "./analyze.js";
import { analyzeJumpDestinations } from "./analyzeJumpDestinations.js";
import * as constants from "./constants.js";
import { equals } from "./equals.js";
import { extractRuntime } from "./extractRuntime.js";
import { formatInstruction } from "./formatInstruction.js";
import { formatInstructions } from "./formatInstructions.js";
import { from as fromValue } from "./from.js";
import { fromHex } from "./fromHex.js";
import { getPushSize } from "./getPushSize.js";
import { hash } from "./hash.js";
import { hasMetadata } from "./hasMetadata.js";
import { isPush } from "./isPush.js";
import { isTerminator } from "./isTerminator.js";
import { isValidJumpDest } from "./isValidJumpDest.js";
import { parseInstructions } from "./parseInstructions.js";
import { size } from "./size.js";
import { stripMetadata } from "./stripMetadata.js";
import { toHex } from "./toHex.js";
import { validate } from "./validate.js";

// Re-export types
export * from "./BrandedBytecode.js";
export * from "./constants.js";

// Re-export method functions for tree-shaking
export {
	analyze,
	analyzeJumpDestinations,
	equals,
	extractRuntime,
	formatInstruction,
	formatInstructions,
	fromHex,
	fromValue as from,
	getPushSize,
	hash,
	hasMetadata,
	isPush,
	isTerminator,
	isValidJumpDest,
	parseInstructions,
	size,
	stripMetadata,
	toHex,
	validate,
};

/**
 * Factory function for creating Bytecode instances
 */
export const Bytecode = ((value: string | Uint8Array) => {
	return fromValue(value);
}) as BytecodeConstructor;

// Initialize prototype
Bytecode.prototype = {} as any;

// Attach static methods
Bytecode.from = fromValue;
Bytecode.fromHex = fromHex;
Bytecode.analyzeJumpDestinations = analyzeJumpDestinations;
Bytecode.isValidJumpDest = isValidJumpDest;
Bytecode.validate = validate;
Bytecode.parseInstructions = parseInstructions;
Bytecode.analyze = analyze;
Bytecode.size = size;
Bytecode.extractRuntime = extractRuntime;
Bytecode.equals = equals;
Bytecode.hash = hash;
Bytecode.toHex = toHex;
Bytecode.formatInstructions = formatInstructions;
Bytecode.formatInstruction = formatInstruction;
Bytecode.hasMetadata = hasMetadata;
Bytecode.stripMetadata = stripMetadata;
Bytecode.isPush = isPush;
Bytecode.getPushSize = getPushSize;
Bytecode.isTerminator = isTerminator;

// Attach constants
Bytecode.JUMPDEST = constants.JUMPDEST;
Bytecode.PUSH1 = constants.PUSH1;
Bytecode.PUSH32 = constants.PUSH32;
Bytecode.STOP = constants.STOP;
Bytecode.RETURN = constants.RETURN;
Bytecode.REVERT = constants.REVERT;
Bytecode.INVALID = constants.INVALID;

// Bind prototype methods using Function.prototype.call.bind
Bytecode.prototype.analyzeJumpDestinations = Function.prototype.call.bind(
	analyzeJumpDestinations,
) as any;
Bytecode.prototype.isValidJumpDest = Function.prototype.call.bind(
	isValidJumpDest,
) as any;
Bytecode.prototype.validate = Function.prototype.call.bind(validate) as any;
Bytecode.prototype.parseInstructions = Function.prototype.call.bind(
	parseInstructions,
) as any;
Bytecode.prototype.analyze = Function.prototype.call.bind(analyze) as any;
Bytecode.prototype.size = Function.prototype.call.bind(size) as any;
Bytecode.prototype.extractRuntime = Function.prototype.call.bind(
	extractRuntime,
) as any;
Bytecode.prototype.equals = Function.prototype.call.bind(equals) as any;
Bytecode.prototype.hash = Function.prototype.call.bind(hash) as any;
Bytecode.prototype.toHex = Function.prototype.call.bind(toHex) as any;
Bytecode.prototype.formatInstructions = Function.prototype.call.bind(
	formatInstructions,
) as any;
Bytecode.prototype.hasMetadata = Function.prototype.call.bind(hasMetadata) as any;
Bytecode.prototype.stripMetadata = Function.prototype.call.bind(
	stripMetadata,
) as any;
