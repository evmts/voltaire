import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
// Import internal functions with proper types
import { analyze as _analyze } from "./analyze.js";
import { analyzeBlocks as _analyzeBlocks } from "./analyzeBlocks.js";
import { analyzeGas as _analyzeGas } from "./analyzeGas.js";
import { analyzeJumpDestinations as _analyzeJumpDestinations } from "./analyzeJumpDestinations.js";
import { analyzeStack as _analyzeStack } from "./analyzeStack.js";
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
// Factory export (tree-shakeable)
export { Hash } from "./hash.js";
// Hash convenience function
const hash = _Hash({ keccak256 });
// Type the internal functions properly
const analyze = _analyze;
const analyzeBlocks = _analyzeBlocks;
const analyzeGas = _analyzeGas;
const analyzeJumpDestinations = _analyzeJumpDestinations;
const analyzeStack = _analyzeStack;
const detectFusions = _detectFusions;
const equals = _equals;
const extractRuntime = _extractRuntime;
const formatInstruction = _formatInstruction;
const formatInstructions = _formatInstructions;
const from = _from;
const fromHex = _fromHex;
const getBlock = _getBlock;
const getPushSize = _getPushSize;
const hasMetadata = _hasMetadata;
const isPush = _isPush;
const isTerminator = _isTerminator;
const isValidJumpDest = _isValidJumpDest;
const parseInstructions = _parseInstructions;
const prettyPrint = _prettyPrint;
const scan = _scan;
const size = _size;
const stripMetadata = _stripMetadata;
const toHex = _toHex;
const toAbi = _toAbi;
const validate = _validate;
// Export individual functions
export { from, fromHex, analyze, analyzeBlocks, analyzeGas, analyzeJumpDestinations, analyzeStack, detectFusions, equals, extractRuntime, formatInstruction, formatInstructions, getBlock, getPushSize, hasMetadata, isPush, isTerminator, isValidJumpDest, parseInstructions, prettyPrint, scan, size, stripMetadata, toHex, toAbi, validate, _getNextPc, hash, };
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
export function Bytecode(value) {
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
Bytecode.from = (value) => {
    const result = BrandedBytecodeNamespace.from(value);
    Object.setPrototypeOf(result, Bytecode.prototype);
    return result;
};
Bytecode.from.prototype = Bytecode.prototype;
Bytecode.fromHex = (value) => {
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
Bytecode.prototype.analyze = function () {
    return BrandedBytecodeNamespace.analyze(this);
};
Bytecode.prototype.analyzeBlocks = function (options) {
    return BrandedBytecodeNamespace.analyzeBlocks(this, options);
};
Bytecode.prototype.analyzeGas = function (options) {
    return BrandedBytecodeNamespace.analyzeGas(this, options);
};
Bytecode.prototype.analyzeJumpDestinations = function () {
    return BrandedBytecodeNamespace.analyzeJumpDestinations(this);
};
Bytecode.prototype.analyzeStack = function (options) {
    return BrandedBytecodeNamespace.analyzeStack(this, options);
};
Bytecode.prototype.detectFusions = function () {
    return BrandedBytecodeNamespace.detectFusions(this);
};
Bytecode.prototype.equals = function (other) {
    return BrandedBytecodeNamespace.equals(this, other);
};
Bytecode.prototype.extractRuntime = function (offset) {
    const result = BrandedBytecodeNamespace.extractRuntime(this, offset);
    Object.setPrototypeOf(result, Bytecode.prototype);
    return result;
};
Bytecode.prototype.formatInstructions = function () {
    return BrandedBytecodeNamespace.formatInstructions(this);
};
Bytecode.prototype.getBlock = function (pc) {
    return BrandedBytecodeNamespace.getBlock(this, pc);
};
Bytecode.prototype.getNextPc = function (currentPc) {
    return BrandedBytecodeNamespace._getNextPc(this, currentPc);
};
Bytecode.prototype.hash = function () {
    return BrandedBytecodeNamespace.hash(this);
};
Bytecode.prototype.hasMetadata = function () {
    return BrandedBytecodeNamespace.hasMetadata(this);
};
Bytecode.prototype.isValidJumpDest = function (offset) {
    return BrandedBytecodeNamespace.isValidJumpDest(this, offset);
};
Bytecode.prototype.parseInstructions = function () {
    return BrandedBytecodeNamespace.parseInstructions(this);
};
Bytecode.prototype.prettyPrint = function (options) {
    return BrandedBytecodeNamespace.prettyPrint(this, options);
};
Bytecode.prototype.scan = function (options) {
    return BrandedBytecodeNamespace.scan(this, options);
};
Bytecode.prototype.size = function () {
    return BrandedBytecodeNamespace.size(this);
};
Bytecode.prototype.stripMetadata = function () {
    const result = BrandedBytecodeNamespace.stripMetadata(this);
    Object.setPrototypeOf(result, Bytecode.prototype);
    return result;
};
Bytecode.prototype.toAbi = function () {
    return BrandedBytecodeNamespace.toAbi(this);
};
Bytecode.prototype.toHex = function () {
    return BrandedBytecodeNamespace.toHex(this);
};
Bytecode.prototype.validate = function () {
    return BrandedBytecodeNamespace.validate(this);
};
// Namespace export - value export for backward compatibility
export { BrandedBytecodeNamespace as BrandedBytecode };
