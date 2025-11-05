// @ts-nocheck
import * as BrandedBytecode from "./BrandedBytecode/index.js";

// Re-export BrandedBytecode type and constants
export type { BrandedBytecode } from "./BrandedBytecode/index.js";
export * from "./BrandedBytecode/constants.js";

/**
 * Factory function for creating Bytecode instances
 */
export function Bytecode(value) {
	const result = BrandedBytecode.from(value);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
}

// Static constructors
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
Bytecode.analyzeJumpDestinations = BrandedBytecode.analyzeJumpDestinations;
Bytecode.equals = BrandedBytecode.equals;
Bytecode.extractRuntime = BrandedBytecode.extractRuntime;
Bytecode.formatInstruction = BrandedBytecode.formatInstruction;
Bytecode.formatInstructions = BrandedBytecode.formatInstructions;
Bytecode.getPushSize = BrandedBytecode.getPushSize;
Bytecode.hash = BrandedBytecode.hash;
Bytecode.hasMetadata = BrandedBytecode.hasMetadata;
Bytecode.isPush = BrandedBytecode.isPush;
Bytecode.isTerminator = BrandedBytecode.isTerminator;
Bytecode.isValidJumpDest = BrandedBytecode.isValidJumpDest;
Bytecode.parseInstructions = BrandedBytecode.parseInstructions;
Bytecode.size = BrandedBytecode.size;
Bytecode.stripMetadata = BrandedBytecode.stripMetadata;
Bytecode.toHex = BrandedBytecode.toHex;
Bytecode.validate = BrandedBytecode.validate;

Bytecode.JUMPDEST = BrandedBytecode.JUMPDEST;
Bytecode.PUSH1 = BrandedBytecode.PUSH1;
Bytecode.PUSH32 = BrandedBytecode.PUSH32;
Bytecode.STOP = BrandedBytecode.STOP;
Bytecode.RETURN = BrandedBytecode.RETURN;
Bytecode.REVERT = BrandedBytecode.REVERT;
Bytecode.INVALID = BrandedBytecode.INVALID;

// Set up Bytecode.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(Bytecode.prototype, Uint8Array.prototype);

// Instance methods
Bytecode.prototype.analyze = function() {
	return BrandedBytecode.analyze(this);
};
Bytecode.prototype.analyzeJumpDestinations = function() {
	return BrandedBytecode.analyzeJumpDestinations(this);
};
Bytecode.prototype.equals = function(other) {
	return BrandedBytecode.equals(this, other);
};
Bytecode.prototype.extractRuntime = function() {
	const result = BrandedBytecode.extractRuntime(this);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
};
Bytecode.prototype.formatInstructions = function() {
	return BrandedBytecode.formatInstructions(this);
};
Bytecode.prototype.hash = function() {
	return BrandedBytecode.hash(this);
};
Bytecode.prototype.hasMetadata = function() {
	return BrandedBytecode.hasMetadata(this);
};
Bytecode.prototype.isValidJumpDest = function(offset) {
	return BrandedBytecode.isValidJumpDest(this, offset);
};
Bytecode.prototype.parseInstructions = function() {
	return BrandedBytecode.parseInstructions(this);
};
Bytecode.prototype.size = function() {
	return BrandedBytecode.size(this);
};
Bytecode.prototype.stripMetadata = function() {
	const result = BrandedBytecode.stripMetadata(this);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
};
Bytecode.prototype.toHex = function() {
	return BrandedBytecode.toHex(this);
};
Bytecode.prototype.validate = function() {
	return BrandedBytecode.validate(this);
};
