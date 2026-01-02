import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
// Import internal functions with proper types
import { analyze as _analyze } from "./analyze.js";
import { analyzeBlocks as _analyzeBlocks } from "./analyzeBlocks.js";
import { analyzeGas as _analyzeGas } from "./analyzeGas.js";
import { analyzeJumpDestinations as _analyzeJumpDestinations } from "./analyzeJumpDestinations.js";
import { analyzeStack as _analyzeStack } from "./analyzeStack.js";
import type {
	Analysis,
	BasicBlock,
	BlockAnalysisOptions,
	BrandedAbi,
	BrandedBytecode,
	GasAnalysis,
	GasAnalysisOptions,
	Instruction,
	PrettyPrintOptions,
	ScanOptions,
	StackAnalysis,
	StackAnalysisOptions,
} from "./BytecodeType.js";
import { detectFusions as _detectFusions } from "./detectFusions.js";
import { equals as _equals } from "./equals.js";
import { extractRuntime as _extractRuntime } from "./extractRuntime.js";
import { formatInstruction as _formatInstruction } from "./formatInstruction.js";
import { formatInstructions as _formatInstructions } from "./formatInstructions.js";
import { from as _from } from "./from.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { getBlock as _getBlock } from "./getBlock.js";
import { getNextPc as _getNextPc } from "./getNextPc.js";
import { getPushSize as _getPushSize } from "./getPushSize.js";
import { Hash as _Hash } from "./hash.js";
import { hasMetadata as _hasMetadata } from "./hasMetadata.js";
import { isPush as _isPush } from "./isPush.js";
import { isTerminator as _isTerminator } from "./isTerminator.js";
import { isValidJumpDest as _isValidJumpDest } from "./isValidJumpDest.js";
import { parseInstructions as _parseInstructions } from "./parseInstructions.js";
import { prettyPrint as _prettyPrint } from "./prettyPrint.js";
import { scan as _scan } from "./scan.js";
import { size as _size } from "./size.js";
import { stripMetadata as _stripMetadata } from "./stripMetadata.js";
import { toAbi as _toAbi } from "./toAbi.js";
import { toHex as _toHex } from "./toHex.js";
import { validate as _validate } from "./validate.js";

// Re-export types
export type * from "./BytecodeType.js";

// Factory export (tree-shakeable)
export { Hash } from "./hash.js";

// Hash convenience function
const hash = _Hash({ keccak256 });

// Type the internal functions properly
const analyze: (code: BrandedBytecode) => Analysis = _analyze;
const analyzeBlocks: (
	bytecode: BrandedBytecode,
	options?: BlockAnalysisOptions,
) => BasicBlock[] = _analyzeBlocks;
const analyzeGas: (
	bytecode: BrandedBytecode,
	options?: GasAnalysisOptions,
) => GasAnalysis = _analyzeGas;
const analyzeJumpDestinations: (code: BrandedBytecode) => ReadonlySet<number> =
	_analyzeJumpDestinations;
const analyzeStack: (
	bytecode: BrandedBytecode,
	options?: StackAnalysisOptions,
) => StackAnalysis = _analyzeStack;
const detectFusions: (code: BrandedBytecode) => unknown = _detectFusions;
const equals: (a: BrandedBytecode, b: BrandedBytecode) => boolean = _equals;
const extractRuntime: (
	code: BrandedBytecode,
	offset: number,
) => BrandedBytecode = _extractRuntime;
const formatInstruction: (inst: Instruction) => string = _formatInstruction;
const formatInstructions: (code: BrandedBytecode) => string[] =
	_formatInstructions;
const from: (value: string | Uint8Array) => BrandedBytecode = _from;
const fromHex: (hex: string) => BrandedBytecode = _fromHex;
const getBlock: (code: BrandedBytecode, pc: number) => BasicBlock | undefined =
	_getBlock;
const getNextPc: (
	code: BrandedBytecode,
	currentPc: number,
) => number | undefined = _getNextPc;
const getPushSize: (opcode: number) => number = _getPushSize;
const hasMetadata: (code: BrandedBytecode) => boolean = _hasMetadata;
const isPush: (opcode: number) => boolean = _isPush;
const isTerminator: (opcode: number) => boolean = _isTerminator;
const isValidJumpDest: (code: BrandedBytecode, offset: number) => boolean =
	_isValidJumpDest;
const parseInstructions: (code: BrandedBytecode) => Instruction[] =
	_parseInstructions;
const prettyPrint: (
	bytecode: BrandedBytecode,
	options?: PrettyPrintOptions,
) => string = _prettyPrint;
const scan: (
	bytecode: BrandedBytecode,
	options?: ScanOptions,
) => Generator<{
	pc: number;
	opcode: number;
	type: "push" | "regular";
	size: number;
	value?: bigint;
	gas?: number;
	stackEffect?: { pop: number; push: number };
}> = _scan;
const size: (code: BrandedBytecode) => number = _size;
const stripMetadata: (code: BrandedBytecode) => BrandedBytecode =
	_stripMetadata;
const toHex: (code: BrandedBytecode, prefix?: boolean) => string = _toHex;
const toAbi: (bytecode: BrandedBytecode) => BrandedAbi = _toAbi;
const validate: (code: BrandedBytecode) => boolean = _validate;

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
const BrandedBytecodeNamespace = {
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
 * @param value - Bytecode input
 * @returns Bytecode instance
 */
export function Bytecode(value: string | Uint8Array) {
	const result = BrandedBytecodeNamespace.from(value);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
}

/**
 * Alias for Bytecode() constructor
 *
 * @deprecated Use `Bytecode(value)` directly instead
 * @param value - Bytecode input
 * @returns Bytecode instance
 */
Bytecode.from = (value: string | Uint8Array) => {
	const result = BrandedBytecodeNamespace.from(value);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
};
Bytecode.from.prototype = Bytecode.prototype;

Bytecode.fromHex = (value: string) => {
	const result = BrandedBytecodeNamespace.fromHex(value);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
};
Bytecode.fromHex.prototype = Bytecode.prototype;

// Static utility methods (don't return Bytecode instances)
Bytecode.analyze = BrandedBytecodeNamespace.analyze;
Bytecode.analyzeBlocks = BrandedBytecodeNamespace.analyzeBlocks;
Bytecode.analyzeGas = BrandedBytecodeNamespace.analyzeGas;
Bytecode.analyzeJumpDestinations =
	BrandedBytecodeNamespace.analyzeJumpDestinations;
Bytecode.analyzeStack = BrandedBytecodeNamespace.analyzeStack;
Bytecode.detectFusions = BrandedBytecodeNamespace.detectFusions;
Bytecode.equals = BrandedBytecodeNamespace.equals;
Bytecode.extractRuntime = BrandedBytecodeNamespace.extractRuntime;
Bytecode.formatInstruction = BrandedBytecodeNamespace.formatInstruction;
Bytecode.formatInstructions = BrandedBytecodeNamespace.formatInstructions;
Bytecode.getBlock = BrandedBytecodeNamespace.getBlock;
Bytecode.getNextPc = BrandedBytecodeNamespace._getNextPc;
Bytecode.getPushSize = BrandedBytecodeNamespace.getPushSize;
Bytecode.hash = BrandedBytecodeNamespace.hash;
Bytecode.hasMetadata = BrandedBytecodeNamespace.hasMetadata;
Bytecode.isPush = BrandedBytecodeNamespace.isPush;
Bytecode.isTerminator = BrandedBytecodeNamespace.isTerminator;
Bytecode.isValidJumpDest = BrandedBytecodeNamespace.isValidJumpDest;
Bytecode.parseInstructions = BrandedBytecodeNamespace.parseInstructions;
Bytecode.prettyPrint = BrandedBytecodeNamespace.prettyPrint;
Bytecode.scan = BrandedBytecodeNamespace.scan;
Bytecode.size = BrandedBytecodeNamespace.size;
Bytecode.stripMetadata = BrandedBytecodeNamespace.stripMetadata;
Bytecode.toAbi = BrandedBytecodeNamespace.toAbi;
Bytecode.toHex = BrandedBytecodeNamespace.toHex;
Bytecode.validate = BrandedBytecodeNamespace.validate;

// Set up Bytecode.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(Bytecode.prototype, Uint8Array.prototype);

// Instance methods
Bytecode.prototype.analyze = function (this: BrandedBytecode) {
	return BrandedBytecodeNamespace.analyze(this);
};
Bytecode.prototype.analyzeBlocks = function (
	this: BrandedBytecode,
	options?: BlockAnalysisOptions,
) {
	return BrandedBytecodeNamespace.analyzeBlocks(this, options);
};
Bytecode.prototype.analyzeGas = function (
	this: BrandedBytecode,
	options?: GasAnalysisOptions,
) {
	return BrandedBytecodeNamespace.analyzeGas(this, options);
};
Bytecode.prototype.analyzeJumpDestinations = function (this: BrandedBytecode) {
	return BrandedBytecodeNamespace.analyzeJumpDestinations(this);
};
Bytecode.prototype.analyzeStack = function (
	this: BrandedBytecode,
	options?: StackAnalysisOptions,
) {
	return BrandedBytecodeNamespace.analyzeStack(this, options);
};
Bytecode.prototype.detectFusions = function (this: BrandedBytecode) {
	return BrandedBytecodeNamespace.detectFusions(this);
};
Bytecode.prototype.equals = function (
	this: BrandedBytecode,
	other: BrandedBytecode,
) {
	return BrandedBytecodeNamespace.equals(this, other);
};
Bytecode.prototype.extractRuntime = function (
	this: BrandedBytecode,
	offset: number,
) {
	const result = BrandedBytecodeNamespace.extractRuntime(this, offset);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
};
Bytecode.prototype.formatInstructions = function (this: BrandedBytecode) {
	return BrandedBytecodeNamespace.formatInstructions(this);
};
Bytecode.prototype.getBlock = function (this: BrandedBytecode, pc: number) {
	return BrandedBytecodeNamespace.getBlock(this, pc);
};
Bytecode.prototype.getNextPc = function (
	this: BrandedBytecode,
	currentPc: number,
) {
	return BrandedBytecodeNamespace._getNextPc(this, currentPc);
};
Bytecode.prototype.hash = function (this: BrandedBytecode) {
	return BrandedBytecodeNamespace.hash(this);
};
Bytecode.prototype.hasMetadata = function (this: BrandedBytecode) {
	return BrandedBytecodeNamespace.hasMetadata(this);
};
Bytecode.prototype.isValidJumpDest = function (
	this: BrandedBytecode,
	offset: number,
) {
	return BrandedBytecodeNamespace.isValidJumpDest(this, offset);
};
Bytecode.prototype.parseInstructions = function (this: BrandedBytecode) {
	return BrandedBytecodeNamespace.parseInstructions(this);
};
Bytecode.prototype.prettyPrint = function (
	this: BrandedBytecode,
	options?: PrettyPrintOptions,
) {
	return BrandedBytecodeNamespace.prettyPrint(this, options);
};
Bytecode.prototype.scan = function (
	this: BrandedBytecode,
	options?: ScanOptions,
) {
	return BrandedBytecodeNamespace.scan(this, options);
};
Bytecode.prototype.size = function (this: BrandedBytecode) {
	return BrandedBytecodeNamespace.size(this);
};
Bytecode.prototype.stripMetadata = function (this: BrandedBytecode) {
	const result = BrandedBytecodeNamespace.stripMetadata(this);
	Object.setPrototypeOf(result, Bytecode.prototype);
	return result;
};
Bytecode.prototype.toAbi = function (this: BrandedBytecode) {
	return BrandedBytecodeNamespace.toAbi(this);
};
Bytecode.prototype.toHex = function (this: BrandedBytecode) {
	return BrandedBytecodeNamespace.toHex(this);
};
Bytecode.prototype.validate = function (this: BrandedBytecode) {
	return BrandedBytecodeNamespace.validate(this);
};

// Namespace export - value export for backward compatibility
export { BrandedBytecodeNamespace as BrandedBytecode };
