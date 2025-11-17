// @ts-nocheck
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";

import { analyze } from "./analyze.js";
import { analyzeBlocks } from "./analyzeBlocks.js";
import { analyzeGas } from "./analyzeGas.js";
import { analyzeJumpDestinations } from "./analyzeJumpDestinations.js";
import { analyzeStack } from "./analyzeStack.js";
import { detectFusions } from "./detectFusions.js";
import { equals } from "./equals.js";
import { extractRuntime } from "./extractRuntime.js";
import { formatInstruction } from "./formatInstruction.js";
import { formatInstructions } from "./formatInstructions.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { getBlock } from "./getBlock.js";
import { getNextPc as _getNextPc } from "./getNextPc.js";
import { getPushSize } from "./getPushSize.js";
import { hasMetadata } from "./hasMetadata.js";
import { Hash } from "./hash.js";
import { isPush } from "./isPush.js";
import { isTerminator } from "./isTerminator.js";
import { isValidJumpDest } from "./isValidJumpDest.js";
import { parseInstructions } from "./parseInstructions.js";
import { prettyPrint } from "./prettyPrint.js";
import { scan } from "./scan.js";
import { size } from "./size.js";
import { stripMetadata } from "./stripMetadata.js";
import { toAbi } from "./toAbi.js";
import { toHex } from "./toHex.js";
import { validate } from "./validate.js";

// Re-export types
export type * from "./BytecodeType.js";

// Factory export (tree-shakeable)
export { Hash } from "./hash.js";

// Hash convenience function
const hash = Hash({ keccak256 });

// Export individual functions
export {
	from,
	fromHex,
	analyze,
	analyzeBlocks,
	analyzeGas,
	analyzeJumpDestinations,
	analyzeStack,
	detectFusions,
	equals,
	extractRuntime,
	formatInstruction,
	formatInstructions,
	getBlock,
	getPushSize,
	hasMetadata,
	isPush,
	isTerminator,
	isValidJumpDest,
	parseInstructions,
	prettyPrint,
	scan,
	size,
	stripMetadata,
	toHex,
	toAbi,
	validate,
	_getNextPc,
	hash,
};

// Wrapper export (convenient, backward compat)
const BrandedBytecode = {
	from,
	fromHex,
	analyze,
	analyzeBlocks,
	analyzeGas,
	analyzeJumpDestinations,
	analyzeStack,
	detectFusions,
	equals,
	extractRuntime,
	formatInstruction,
	formatInstructions,
	getBlock,
	getPushSize,
	hash,
	hasMetadata,
	isPush,
	isTerminator,
	isValidJumpDest,
	parseInstructions,
	prettyPrint,
	scan,
	toAbi,
	size,
	stripMetadata,
	toHex,
	validate,
	_getNextPc,
};

/**
 * Create a Bytecode instance from various input types
 *
 * Primary constructor - use this for Class API:
 * ```typescript
 * import { Bytecode } from '@tevm/voltaire'
 * const code = Bytecode("0x6001")
 * ```
 *
 * @param {import('./index.js').BytecodeLike} value - Bytecode input
 * @returns {BrandedBytecode & typeof Bytecode.prototype} Bytecode instance
 */
export function Bytecode(value) {
	const result = BrandedBytecode.from(value);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
}

/**
 * Alias for Bytecode() constructor
 *
 * @deprecated Use `Bytecode(value)` directly instead
 * @param {import('./index.js').BytecodeLike} value - Bytecode input
 * @returns {BrandedBytecode & typeof Bytecode.prototype} Bytecode instance
 */
Bytecode.from = (value) => {
	const result = BrandedBytecode.from(value);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
};
Bytecode.from.prototype = Bytecode.prototype;

Bytecode.fromHex = (value) => {
	const result = BrandedBytecode.fromHex(value);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
};
Bytecode.fromHex.prototype = Bytecode.prototype;

// Static utility methods (don't return Bytecode instances)
Bytecode.analyze = BrandedBytecode.analyze;
Bytecode.analyzeBlocks = BrandedBytecode.analyzeBlocks;
Bytecode.analyzeGas = BrandedBytecode.analyzeGas;
Bytecode.analyzeJumpDestinations = BrandedBytecode.analyzeJumpDestinations;
Bytecode.analyzeStack = BrandedBytecode.analyzeStack;
Bytecode.detectFusions = BrandedBytecode.detectFusions;
Bytecode.equals = BrandedBytecode.equals;
Bytecode.extractRuntime = BrandedBytecode.extractRuntime;
Bytecode.formatInstruction = BrandedBytecode.formatInstruction;
Bytecode.formatInstructions = BrandedBytecode.formatInstructions;
Bytecode.getBlock = BrandedBytecode.getBlock;
Bytecode.getNextPc = BrandedBytecode._getNextPc;
Bytecode.getPushSize = BrandedBytecode.getPushSize;
Bytecode.hash = BrandedBytecode.hash;
Bytecode.hasMetadata = BrandedBytecode.hasMetadata;
Bytecode.isPush = BrandedBytecode.isPush;
Bytecode.isTerminator = BrandedBytecode.isTerminator;
Bytecode.isValidJumpDest = BrandedBytecode.isValidJumpDest;
Bytecode.parseInstructions = BrandedBytecode.parseInstructions;
Bytecode.prettyPrint = BrandedBytecode.prettyPrint;
Bytecode.scan = BrandedBytecode.scan;
Bytecode.size = BrandedBytecode.size;
Bytecode.stripMetadata = BrandedBytecode.stripMetadata;
Bytecode.toAbi = BrandedBytecode.toAbi;
Bytecode.toHex = BrandedBytecode.toHex;
Bytecode.validate = BrandedBytecode.validate;

// Set up Bytecode.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(Bytecode.prototype, Uint8Array.prototype);

// Instance methods
Bytecode.prototype.analyze = function () {
	return BrandedBytecode.analyze(this);
};
Bytecode.prototype.analyzeBlocks = function (options) {
	return BrandedBytecode.analyzeBlocks(this, options);
};
Bytecode.prototype.analyzeGas = function (options) {
	return BrandedBytecode.analyzeGas(this, options);
};
Bytecode.prototype.analyzeJumpDestinations = function () {
	return BrandedBytecode.analyzeJumpDestinations(this);
};
Bytecode.prototype.analyzeStack = function (options) {
	return BrandedBytecode.analyzeStack(this, options);
};
Bytecode.prototype.detectFusions = function () {
	return BrandedBytecode.detectFusions(this);
};
Bytecode.prototype.equals = function (other) {
	return BrandedBytecode.equals(this, other);
};
Bytecode.prototype.extractRuntime = function () {
	const result = BrandedBytecode.extractRuntime(this);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
};
Bytecode.prototype.formatInstructions = function () {
	return BrandedBytecode.formatInstructions(this);
};
Bytecode.prototype.getBlock = function (pc) {
	return BrandedBytecode.getBlock(this, pc);
};
Bytecode.prototype.getNextPc = function (currentPc) {
	return BrandedBytecode._getNextPc(this, currentPc);
};
Bytecode.prototype.hash = function () {
	return BrandedBytecode.hash(this);
};
Bytecode.prototype.hasMetadata = function () {
	return BrandedBytecode.hasMetadata(this);
};
Bytecode.prototype.isValidJumpDest = function (offset) {
	return BrandedBytecode.isValidJumpDest(this, offset);
};
Bytecode.prototype.parseInstructions = function () {
	return BrandedBytecode.parseInstructions(this);
};
Bytecode.prototype.prettyPrint = function (options) {
	return BrandedBytecode.prettyPrint(this, options);
};
Bytecode.prototype.scan = function (options) {
	return BrandedBytecode.scan(this, options);
};
Bytecode.prototype.size = function () {
	return BrandedBytecode.size(this);
};
Bytecode.prototype.stripMetadata = function () {
	const result = BrandedBytecode.stripMetadata(this);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
};
Bytecode.prototype.toAbi = function () {
	return BrandedBytecode.toAbi(this);
};
Bytecode.prototype.toHex = function () {
	return BrandedBytecode.toHex(this);
};
Bytecode.prototype.validate = function () {
	return BrandedBytecode.validate(this);
};

// Namespace export
export { BrandedBytecode };
