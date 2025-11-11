/**
 * Branded Bytecode type
 */

/**
 * EVM Bytecode (Uint8Array)
 */
export type BrandedBytecode = Uint8Array & { readonly __tag: "Bytecode" };

/**
 * EVM opcode (single byte instruction)
 */
export type Opcode = number;

/**
 * Jump destination information
 */
export type JumpDest = {
	/** Position in bytecode */
	readonly position: number;
	/** Whether this is a valid jump destination */
	readonly valid: boolean;
};

/**
 * Bytecode instruction
 */
export type Instruction = {
	/** Opcode value */
	readonly opcode: Opcode;
	/** Position in bytecode */
	readonly position: number;
	/** Push data if PUSH instruction */
	readonly pushData?: Uint8Array;
};

/**
 * Bytecode analysis result
 */
export type Analysis = {
	/** Valid JUMPDEST positions */
	readonly jumpDestinations: ReadonlySet<number>;
	/** All instructions */
	readonly instructions: readonly Instruction[];
	/** Whether bytecode is valid */
	readonly valid: boolean;
};

/**
 * Opcode metadata
 */
export type OpcodeMetadata = {
	/** Opcode value */
	readonly opcode: Opcode;
	/** Mnemonic name */
	readonly name: string;
	/** Gas cost (base) */
	readonly gas: number;
	/** Stack items removed */
	readonly inputs: number;
	/** Stack items added */
	readonly outputs: number;
};

/**
 * Branded hex string for bytecode
 */
export type BrandedBytecodeHex = string & { readonly __tag: "BytecodeHex" };

/**
 * Branded ABI type
 */
export type BrandedAbi = ReadonlyArray<ABIItem> & { readonly __tag: "Abi" };

/**
 * ABI item (function or event)
 */
export type ABIItem = ABIFunction | ABIEvent;

/**
 * ABI function extracted from bytecode
 */
export interface ABIFunction {
	type: "function";
	selector: string;
	stateMutability: "pure" | "view" | "nonpayable" | "payable";
	payable: boolean;
	inputs?: [{ type: "bytes"; name: "" }];
	outputs?: [{ type: "bytes"; name: "" }];
}

/**
 * ABI event extracted from bytecode
 */
export interface ABIEvent {
	type: "event";
	hash: string;
}

/**
 * Options for scan() iterator
 */
export interface ScanOptions {
	/** Include gas cost for each instruction */
	withGas?: boolean;
	/** Include stack effect metadata */
	withStack?: boolean;
	/** Detect and yield fusion patterns */
	detectFusions?: boolean;
	/** Start iteration at specific PC */
	startPc?: number;
	/** Stop iteration at specific PC */
	endPc?: number;
}

/**
 * Block terminator type
 */
export type TerminatorType =
	| "stop"
	| "return"
	| "revert"
	| "invalid"
	| "selfdestruct"
	| "jump"
	| "jumpi"
	| "fallthrough";

/**
 * Basic block metadata
 */
export interface BasicBlock {
	/** Block index (0-based) */
	index: number;
	/** Starting program counter */
	startPc: number;
	/** Ending program counter (exclusive) */
	endPc: number;
	/** Number of instructions in block */
	instructionCount: number;
	/** Total static gas cost */
	gasEstimate: number;
	/** Minimum stack items required to enter */
	minStack: number;
	/** Maximum stack depth reached */
	maxStack: number;
	/** Net stack effect (exit - entry) */
	stackEffect: number;
	/** Block terminator type */
	terminator: TerminatorType;
	/** Jump target PC (if terminator is JUMP/JUMPI) */
	target?: number;
	/** Whether block is reachable from entry */
	isReachable: boolean;
	/** Successor block indices */
	successors: number[];
	/** Predecessor block indices */
	predecessors: number[];
}

/**
 * Options for analyzeBlocks()
 */
export interface BlockAnalysisOptions {
	/** Compute reachability from entry point */
	computeReachability?: boolean;
	/** Build control flow graph (predecessors/successors) */
	buildCFG?: boolean;
	/** Include unreachable blocks in results */
	includeUnreachable?: boolean;
	/** Validate bytecode structure */
	validate?: boolean;
}

/**
 * Gas analysis result
 */
export interface GasAnalysis {
	/** Total static gas cost */
	total: bigint;
	/** Gas breakdown by instruction */
	byInstruction: InstructionGas[];
	/** Gas breakdown by block */
	byBlock: BlockGas[];
	/** Expensive instructions (>1000 gas) */
	expensive: ExpensiveInstruction[];
	/** Path analysis (if enabled) */
	paths?: {
		cheapest: ExecutionPath;
		mostExpensive: ExecutionPath;
		average: bigint;
	};
}

/**
 * Instruction gas information
 */
export interface InstructionGas {
	pc: number;
	opcode: string;
	gas: number;
	cumulative: bigint;
}

/**
 * Block gas information
 */
export interface BlockGas {
	blockIndex: number;
	startPc: number;
	endPc: number;
	gas: number;
	percentage: number;
}

/**
 * Expensive instruction information
 */
export interface ExpensiveInstruction {
	pc: number;
	opcode: string;
	gas: number;
	category: string;
}

/**
 * Execution path information
 */
export interface ExecutionPath {
	blocks: number[];
	gas: bigint;
	instructions: number;
}

/**
 * Options for analyzeGas()
 */
export interface GasAnalysisOptions {
	/** Analyze different execution paths */
	analyzePaths?: boolean;
	/** Maximum paths to explore */
	maxPaths?: number;
	/** Include dynamic gas costs */
	includeDynamic?: boolean;
	/** Context for warm/cold gas calculations */
	context?: {
		warmAddresses?: Set<string>;
		warmSlots?: Set<bigint>;
	};
}

/**
 * Stack analysis result
 */
export interface StackAnalysis {
	/** Whether stack constraints are satisfied */
	valid: boolean;
	/** Maximum stack depth reached */
	maxDepth: number;
	/** Stack issues found */
	issues: StackIssue[];
	/** Stack info by block */
	byBlock: BlockStackInfo[];
	/** Number of paths analyzed */
	pathsAnalyzed: number;
}

/**
 * Stack issue information
 */
export interface StackIssue {
	type: "underflow" | "overflow" | "unreachable" | "inconsistent";
	pc: number;
	blockIndex: number;
	expected: number;
	actual: number;
	message: string;
	opcode?: string;
}

/**
 * Block stack information
 */
export interface BlockStackInfo {
	blockIndex: number;
	startPc: number;
	endPc: number;
	minRequired: number;
	maxReached: number;
	exitDepth: number;
	stackEffect: number;
}

/**
 * Options for analyzeStack()
 */
export interface StackAnalysisOptions {
	/** Initial stack depth */
	initialDepth?: number;
	/** Maximum allowed stack depth */
	maxDepth?: number;
	/** Analyze different execution paths */
	analyzePaths?: boolean;
	/** Maximum paths to explore */
	maxPaths?: number;
	/** Stop at first error */
	failFast?: boolean;
}

/**
 * Options for prettyPrint()
 */
export interface PrettyPrintOptions {
	/** Enable ANSI color codes */
	colors?: boolean;
	/** Show gas costs */
	showGas?: boolean;
	/** Show stack effects */
	showStack?: boolean;
	/** Show block boundaries */
	showBlocks?: boolean;
	/** Show jump arrows */
	showJumpArrows?: boolean;
	/** Show fusion patterns */
	showFusions?: boolean;
	/** Show line numbers */
	lineNumbers?: boolean;
	/** Show summary footer */
	showSummary?: boolean;
	/** Maximum output width */
	maxWidth?: number;
	/** Compact mode (less whitespace) */
	compact?: boolean;
}
