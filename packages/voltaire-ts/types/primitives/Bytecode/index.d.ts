import type { Analysis, BasicBlock, BlockAnalysisOptions, BrandedAbi, BrandedBytecode, GasAnalysis, GasAnalysisOptions, Instruction, PrettyPrintOptions, ScanOptions, StackAnalysis, StackAnalysisOptions } from "./BytecodeType.js";
import { getNextPc as _getNextPc } from "./getNextPc.js";
export type * from "./BytecodeType.js";
export { Hash } from "./hash.js";
declare const hash: (code: import("./BytecodeType.js").BrandedBytecode) => any;
declare const analyze: (code: BrandedBytecode) => Analysis;
declare const analyzeBlocks: (bytecode: BrandedBytecode, options?: BlockAnalysisOptions) => BasicBlock[];
declare const analyzeGas: (bytecode: BrandedBytecode, options?: GasAnalysisOptions) => GasAnalysis;
declare const analyzeJumpDestinations: (code: BrandedBytecode) => ReadonlySet<number>;
declare const analyzeStack: (bytecode: BrandedBytecode, options?: StackAnalysisOptions) => StackAnalysis;
declare const detectFusions: (code: BrandedBytecode) => unknown;
declare const equals: (a: BrandedBytecode, b: BrandedBytecode) => boolean;
declare const extractRuntime: (code: BrandedBytecode, offset: number) => BrandedBytecode;
declare const formatInstruction: (inst: Instruction) => string;
declare const formatInstructions: (code: BrandedBytecode) => string[];
declare const from: (value: string | Uint8Array) => BrandedBytecode;
declare const fromHex: (hex: string) => BrandedBytecode;
declare const getBlock: (code: BrandedBytecode, pc: number) => BasicBlock | undefined;
declare const getPushSize: (opcode: number) => number;
declare const hasMetadata: (code: BrandedBytecode) => boolean;
declare const isPush: (opcode: number) => boolean;
declare const isTerminator: (opcode: number) => boolean;
declare const isValidJumpDest: (code: BrandedBytecode, offset: number) => boolean;
declare const parseInstructions: (code: BrandedBytecode) => Instruction[];
declare const prettyPrint: (bytecode: BrandedBytecode, options?: PrettyPrintOptions) => string;
declare const scan: (bytecode: BrandedBytecode, options?: ScanOptions) => Generator<{
    pc: number;
    opcode: number;
    type: "push" | "regular";
    size: number;
    value?: bigint;
    gas?: number;
    stackEffect?: {
        pop: number;
        push: number;
    };
}>;
declare const size: (code: BrandedBytecode) => number;
declare const stripMetadata: (code: BrandedBytecode) => BrandedBytecode;
declare const toHex: (code: BrandedBytecode, prefix?: boolean) => string;
declare const toAbi: (bytecode: BrandedBytecode) => BrandedAbi;
declare const validate: (code: BrandedBytecode) => boolean;
export { from, fromHex, analyze, analyzeBlocks, analyzeGas, analyzeJumpDestinations, analyzeStack, detectFusions, equals, extractRuntime, formatInstruction, formatInstructions, getBlock, getPushSize, hasMetadata, isPush, isTerminator, isValidJumpDest, parseInstructions, prettyPrint, scan, size, stripMetadata, toHex, toAbi, validate, _getNextPc, hash, };
declare const BrandedBytecodeNamespace: {
    from: (value: string | Uint8Array) => BrandedBytecode;
    fromHex: (hex: string) => BrandedBytecode;
    analyze: (code: BrandedBytecode) => Analysis;
    analyzeBlocks: (bytecode: BrandedBytecode, options?: BlockAnalysisOptions) => BasicBlock[];
    analyzeGas: (bytecode: BrandedBytecode, options?: GasAnalysisOptions) => GasAnalysis;
    analyzeJumpDestinations: (code: BrandedBytecode) => ReadonlySet<number>;
    analyzeStack: (bytecode: BrandedBytecode, options?: StackAnalysisOptions) => StackAnalysis;
    detectFusions: (code: BrandedBytecode) => unknown;
    equals: (a: BrandedBytecode, b: BrandedBytecode) => boolean;
    extractRuntime: (code: BrandedBytecode, offset: number) => BrandedBytecode;
    formatInstruction: (inst: Instruction) => string;
    formatInstructions: (code: BrandedBytecode) => string[];
    getBlock: (code: BrandedBytecode, pc: number) => BasicBlock | undefined;
    getPushSize: (opcode: number) => number;
    hash: (code: import("./BytecodeType.js").BrandedBytecode) => any;
    hasMetadata: (code: BrandedBytecode) => boolean;
    isPush: (opcode: number) => boolean;
    isTerminator: (opcode: number) => boolean;
    isValidJumpDest: (code: BrandedBytecode, offset: number) => boolean;
    parseInstructions: (code: BrandedBytecode) => Instruction[];
    prettyPrint: (bytecode: BrandedBytecode, options?: PrettyPrintOptions) => string;
    scan: (bytecode: BrandedBytecode, options?: ScanOptions) => Generator<{
        pc: number;
        opcode: number;
        type: "push" | "regular";
        size: number;
        value?: bigint;
        gas?: number;
        stackEffect?: {
            pop: number;
            push: number;
        };
    }>;
    toAbi: (bytecode: BrandedBytecode) => BrandedAbi;
    size: (code: BrandedBytecode) => number;
    stripMetadata: (code: BrandedBytecode) => BrandedBytecode;
    toHex: (code: BrandedBytecode, prefix?: boolean) => string;
    validate: (code: BrandedBytecode) => boolean;
    _getNextPc: typeof _getNextPc;
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
export declare function Bytecode(value: string | Uint8Array): BrandedBytecode;
export declare namespace Bytecode {
    var from: (value: string | Uint8Array) => BrandedBytecode;
    var fromHex: (value: string) => BrandedBytecode;
    var analyze: (code: BrandedBytecode) => Analysis;
    var analyzeBlocks: (bytecode: BrandedBytecode, options?: BlockAnalysisOptions) => BasicBlock[];
    var analyzeGas: (bytecode: BrandedBytecode, options?: GasAnalysisOptions) => GasAnalysis;
    var analyzeJumpDestinations: (code: BrandedBytecode) => ReadonlySet<number>;
    var analyzeStack: (bytecode: BrandedBytecode, options?: StackAnalysisOptions) => StackAnalysis;
    var detectFusions: (code: BrandedBytecode) => unknown;
    var equals: (a: BrandedBytecode, b: BrandedBytecode) => boolean;
    var extractRuntime: (code: BrandedBytecode, offset: number) => BrandedBytecode;
    var formatInstruction: (inst: Instruction) => string;
    var formatInstructions: (code: BrandedBytecode) => string[];
    var getBlock: (code: BrandedBytecode, pc: number) => BasicBlock | undefined;
    var getNextPc: typeof _getNextPc;
    var getPushSize: (opcode: number) => number;
    var hash: (code: import("./BytecodeType.js").BrandedBytecode) => any;
    var hasMetadata: (code: BrandedBytecode) => boolean;
    var isPush: (opcode: number) => boolean;
    var isTerminator: (opcode: number) => boolean;
    var isValidJumpDest: (code: BrandedBytecode, offset: number) => boolean;
    var parseInstructions: (code: BrandedBytecode) => Instruction[];
    var prettyPrint: (bytecode: BrandedBytecode, options?: PrettyPrintOptions) => string;
    var scan: (bytecode: BrandedBytecode, options?: ScanOptions) => Generator<{
        pc: number;
        opcode: number;
        type: "push" | "regular";
        size: number;
        value?: bigint;
        gas?: number;
        stackEffect?: {
            pop: number;
            push: number;
        };
    }>;
    var size: (code: BrandedBytecode) => number;
    var stripMetadata: (code: BrandedBytecode) => BrandedBytecode;
    var toAbi: (bytecode: BrandedBytecode) => BrandedAbi;
    var toHex: (code: BrandedBytecode, prefix?: boolean) => string;
    var validate: (code: BrandedBytecode) => boolean;
}
export { BrandedBytecodeNamespace as BrandedBytecode };
//# sourceMappingURL=index.d.ts.map