// @ts-nocheck
export * from "./constants.js";
export * from "./BrandedBytecode.js";

import { analyze } from "./analyze.js";
import { analyzeJumpDestinations } from "./analyzeJumpDestinations.js";
import { equals } from "./equals.js";
import { extractRuntime } from "./extractRuntime.js";
import { formatInstruction } from "./formatInstruction.js";
import { formatInstructions } from "./formatInstructions.js";
import { from } from "./from.js";
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
import {
	JUMPDEST,
	PUSH1,
	PUSH32,
	STOP,
	RETURN,
	REVERT,
	INVALID,
} from "./constants.js";

// Export individual functions
export {
	from,
	fromHex,
	analyze,
	analyzeJumpDestinations,
	equals,
	extractRuntime,
	formatInstruction,
	formatInstructions,
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
 * @typedef {import('./BrandedBytecode.js').BrandedBytecode} BrandedBytecode
 * @typedef {import('./BytecodeConstructor.js').BytecodeConstructor} BytecodeConstructor
 */

/**
 * Factory function for creating Bytecode instances
 *
 * @type {BytecodeConstructor}
 */
export function Bytecode(value) {
	return from(value);
}

Bytecode.from = function (value) {
	return from(value);
};
Bytecode.from.prototype = Bytecode.prototype;
Bytecode.fromHex = function (value) {
	return fromHex(value);
};
Bytecode.fromHex.prototype = Bytecode.prototype;

Bytecode.analyze = analyze;
Bytecode.analyzeJumpDestinations = analyzeJumpDestinations;
Bytecode.equals = equals;
Bytecode.extractRuntime = extractRuntime;
Bytecode.formatInstruction = formatInstruction;
Bytecode.formatInstructions = formatInstructions;
Bytecode.getPushSize = getPushSize;
Bytecode.hash = hash;
Bytecode.hasMetadata = hasMetadata;
Bytecode.isPush = isPush;
Bytecode.isTerminator = isTerminator;
Bytecode.isValidJumpDest = isValidJumpDest;
Bytecode.parseInstructions = parseInstructions;
Bytecode.size = size;
Bytecode.stripMetadata = stripMetadata;
Bytecode.toHex = toHex;
Bytecode.validate = validate;

Bytecode.JUMPDEST = JUMPDEST;
Bytecode.PUSH1 = PUSH1;
Bytecode.PUSH32 = PUSH32;
Bytecode.STOP = STOP;
Bytecode.RETURN = RETURN;
Bytecode.REVERT = REVERT;
Bytecode.INVALID = INVALID;

Bytecode.prototype.analyze = Function.prototype.call.bind(analyze);
Bytecode.prototype.analyzeJumpDestinations = Function.prototype.call.bind(
	analyzeJumpDestinations,
);
Bytecode.prototype.equals = Function.prototype.call.bind(equals);
Bytecode.prototype.extractRuntime = Function.prototype.call.bind(extractRuntime);
Bytecode.prototype.formatInstructions = Function.prototype.call.bind(
	formatInstructions,
);
Bytecode.prototype.hash = Function.prototype.call.bind(hash);
Bytecode.prototype.hasMetadata = Function.prototype.call.bind(hasMetadata);
Bytecode.prototype.isValidJumpDest = Function.prototype.call.bind(isValidJumpDest);
Bytecode.prototype.parseInstructions = Function.prototype.call.bind(
	parseInstructions,
);
Bytecode.prototype.size = Function.prototype.call.bind(size);
Bytecode.prototype.stripMetadata = Function.prototype.call.bind(stripMetadata);
Bytecode.prototype.toHex = Function.prototype.call.bind(toHex);
Bytecode.prototype.validate = Function.prototype.call.bind(validate);
