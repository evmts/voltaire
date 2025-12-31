/**
 * Simple EVM - A Minimal Ethereum Virtual Machine Implementation
 *
 * This example demonstrates how to build a basic EVM interpreter using Voltaire primitives.
 * It implements ~27 core opcodes: arithmetic, stack, memory, and control flow operations.
 *
 * Features:
 * - Stack-based execution (max 1024 items)
 * - Sparse memory with expansion cost tracking
 * - Gas metering per opcode
 * - JUMPDEST validation
 *
 * Voltaire primitives used:
 * - Opcode: constants, getGasCost(), getName(), isPush(), getPushSize(), jumpDests()
 * - Hex: bytecode parsing with Hex(), toBytes()
 * - Keccak256: code hashing demonstration
 * - Address: execution context
 */

import { Opcode } from "../../src/primitives/Opcode/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";
import * as Keccak256 from "../../src/crypto/Keccak256/index.js";
import * as Address from "../../src/primitives/Address/index.js";

// ============================================================
// SECTION 1: TYPES AND ERRORS
// ============================================================

const UINT256_MAX = 2n ** 256n;
const MAX_STACK_SIZE = 1024;

/** Modular arithmetic for uint256 */
const mod256 = (n: bigint): bigint => ((n % UINT256_MAX) + UINT256_MAX) % UINT256_MAX;

/** Base error class for EVM errors */
export class EvmError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "EvmError";
	}
}

export class StackUnderflowError extends EvmError {
	constructor() {
		super("Stack underflow");
		this.name = "StackUnderflowError";
	}
}

export class StackOverflowError extends EvmError {
	constructor() {
		super("Stack overflow (max 1024 items)");
		this.name = "StackOverflowError";
	}
}

export class InvalidJumpDestError extends EvmError {
	constructor(dest: number) {
		super(`Invalid jump destination: ${dest}`);
		this.name = "InvalidJumpDestError";
	}
}

export class OutOfGasError extends EvmError {
	constructor(required: bigint, available: bigint) {
		super(`Out of gas: required ${required}, available ${available}`);
		this.name = "OutOfGasError";
	}
}

export class InvalidOpcodeError extends EvmError {
	constructor(opcode: number) {
		super(`Invalid opcode: 0x${opcode.toString(16).padStart(2, "0")}`);
		this.name = "InvalidOpcodeError";
	}
}

/** EVM execution state */
export type EvmState = {
	stack: bigint[];
	memory: Map<number, number>;
	memorySize: number;
	pc: number;
	gas: bigint;
	bytecode: Uint8Array;
	stopped: boolean;
	reverted: boolean;
	output: Uint8Array;
	validJumpDests: Set<number>;
	codeHash: Uint8Array;
};

/** Result of EVM execution */
export type ExecutionResult = {
	success: boolean;
	output: Uint8Array;
	gasUsed: bigint;
	gasRemaining: bigint;
	error?: string;
	finalStack: bigint[];
};

/** Execution context (caller, origin, etc.) */
export type ExecutionContext = {
	caller: ReturnType<typeof Address.from>;
	origin: ReturnType<typeof Address.from>;
	address: ReturnType<typeof Address.from>;
	gasLimit: bigint;
};

// ============================================================
// SECTION 2: STATE MANAGEMENT
// ============================================================

/**
 * Create initial EVM state from bytecode
 *
 * Uses Voltaire's Opcode.jumpDests() to precompute valid jump destinations
 * and Keccak256 to hash the bytecode for identification.
 */
export function createState(bytecode: Uint8Array, gas: bigint): EvmState {
	// Use Voltaire's jumpDests to find valid JUMPDEST positions
	const validJumpDests = Opcode.jumpDests(bytecode);

	// Use Voltaire's Keccak256 to hash bytecode (for identification/debugging)
	const codeHash = Keccak256.hash(bytecode);

	return {
		stack: [],
		memory: new Map(),
		memorySize: 0,
		pc: 0,
		gas,
		bytecode,
		stopped: false,
		reverted: false,
		output: new Uint8Array(0),
		validJumpDests,
		codeHash,
	};
}

/** Push value onto stack with overflow check */
export function stackPush(state: EvmState, value: bigint): void {
	if (state.stack.length >= MAX_STACK_SIZE) {
		throw new StackOverflowError();
	}
	state.stack.push(mod256(value));
}

/** Pop value from stack with underflow check */
export function stackPop(state: EvmState): bigint {
	if (state.stack.length === 0) {
		throw new StackUnderflowError();
	}
	return state.stack.pop()!;
}

/** Peek at stack item at given depth (0 = top) */
export function stackPeek(state: EvmState, depth: number): bigint {
	if (depth >= state.stack.length) {
		throw new StackUnderflowError();
	}
	return state.stack[state.stack.length - 1 - depth];
}

/** Calculate memory expansion cost: 3n + n²/512 where n = words */
export function memoryExpansionCost(
	currentBytes: number,
	newBytes: number,
): bigint {
	if (newBytes <= currentBytes) return 0n;

	const currentWords = Math.ceil(currentBytes / 32);
	const newWords = Math.ceil(newBytes / 32);

	const currentCost =
		currentWords * 3 + Math.floor((currentWords * currentWords) / 512);
	const newCost = newWords * 3 + Math.floor((newWords * newWords) / 512);

	return BigInt(newCost - currentCost);
}

/** Expand memory to accommodate access at offset+size */
function expandMemory(state: EvmState, offset: number, size: number): void {
	const newSize = offset + size;
	if (newSize > state.memorySize) {
		const expansionCost = memoryExpansionCost(state.memorySize, newSize);
		consumeGas(state, expansionCost);
		// Round up to 32-byte boundary
		state.memorySize = Math.ceil(newSize / 32) * 32;
	}
}

/** Load 32 bytes from memory as bigint */
export function memoryLoad(state: EvmState, offset: number): bigint {
	expandMemory(state, offset, 32);

	let result = 0n;
	for (let i = 0; i < 32; i++) {
		const byte = state.memory.get(offset + i) ?? 0;
		result = (result << 8n) | BigInt(byte);
	}
	return result;
}

/** Store 32-byte bigint to memory */
export function memoryStore(state: EvmState, offset: number, value: bigint): void {
	expandMemory(state, offset, 32);

	for (let i = 31; i >= 0; i--) {
		state.memory.set(offset + i, Number(value & 0xffn));
		value >>= 8n;
	}
}

/** Store single byte to memory */
export function memoryStore8(state: EvmState, offset: number, value: bigint): void {
	expandMemory(state, offset, 1);
	state.memory.set(offset, Number(value & 0xffn));
}

/** Read memory range as bytes */
export function memoryRead(state: EvmState, offset: number, size: number): Uint8Array {
	if (size === 0) return new Uint8Array(0);
	expandMemory(state, offset, size);

	const result = new Uint8Array(size);
	for (let i = 0; i < size; i++) {
		result[i] = state.memory.get(offset + i) ?? 0;
	}
	return result;
}

/** Consume gas with out-of-gas check */
export function consumeGas(state: EvmState, amount: bigint): void {
	if (amount > state.gas) {
		throw new OutOfGasError(amount, state.gas);
	}
	state.gas -= amount;
}

// ============================================================
// SECTION 3: OPCODE HANDLERS
// ============================================================

// --- Arithmetic Operations ---

function opAdd(state: EvmState): void {
	const a = stackPop(state);
	const b = stackPop(state);
	stackPush(state, a + b);
}

function opMul(state: EvmState): void {
	const a = stackPop(state);
	const b = stackPop(state);
	stackPush(state, a * b);
}

function opSub(state: EvmState): void {
	const a = stackPop(state);
	const b = stackPop(state);
	stackPush(state, a - b);
}

function opDiv(state: EvmState): void {
	const a = stackPop(state);
	const b = stackPop(state);
	stackPush(state, b === 0n ? 0n : a / b);
}

function opMod(state: EvmState): void {
	const a = stackPop(state);
	const b = stackPop(state);
	stackPush(state, b === 0n ? 0n : a % b);
}

function opLt(state: EvmState): void {
	const a = stackPop(state);
	const b = stackPop(state);
	stackPush(state, a < b ? 1n : 0n);
}

function opGt(state: EvmState): void {
	const a = stackPop(state);
	const b = stackPop(state);
	stackPush(state, a > b ? 1n : 0n);
}

function opEq(state: EvmState): void {
	const a = stackPop(state);
	const b = stackPop(state);
	stackPush(state, a === b ? 1n : 0n);
}

function opIszero(state: EvmState): void {
	const a = stackPop(state);
	stackPush(state, a === 0n ? 1n : 0n);
}

function opNot(state: EvmState): void {
	const a = stackPop(state);
	// Bitwise NOT in 256-bit space: ~a = (2^256 - 1) - a
	stackPush(state, (UINT256_MAX - 1n) - a);
}

function opAnd(state: EvmState): void {
	const a = stackPop(state);
	const b = stackPop(state);
	stackPush(state, a & b);
}

function opOr(state: EvmState): void {
	const a = stackPop(state);
	const b = stackPop(state);
	stackPush(state, a | b);
}

function opXor(state: EvmState): void {
	const a = stackPop(state);
	const b = stackPop(state);
	stackPush(state, a ^ b);
}

// --- Stack Operations ---

function opPush(state: EvmState, size: number): void {
	let value = 0n;
	for (let i = 0; i < size; i++) {
		const byte = state.bytecode[state.pc + 1 + i] ?? 0;
		value = (value << 8n) | BigInt(byte);
	}
	stackPush(state, value);
	state.pc += size; // Will be incremented by 1 more in step()
}

function opPop(state: EvmState): void {
	stackPop(state);
}

function opDup(state: EvmState, position: number): void {
	const value = stackPeek(state, position - 1);
	stackPush(state, value);
}

function opSwap(state: EvmState, position: number): void {
	const topIdx = state.stack.length - 1;
	const swapIdx = state.stack.length - 1 - position;

	if (swapIdx < 0) {
		throw new StackUnderflowError();
	}

	const temp = state.stack[topIdx];
	state.stack[topIdx] = state.stack[swapIdx];
	state.stack[swapIdx] = temp;
}

// --- Memory Operations ---

function opMload(state: EvmState): void {
	const offset = stackPop(state);
	const value = memoryLoad(state, Number(offset));
	stackPush(state, value);
}

function opMstore(state: EvmState): void {
	const offset = stackPop(state);
	const value = stackPop(state);
	memoryStore(state, Number(offset), value);
}

function opMstore8(state: EvmState): void {
	const offset = stackPop(state);
	const value = stackPop(state);
	memoryStore8(state, Number(offset), value);
}

function opMsize(state: EvmState): void {
	stackPush(state, BigInt(state.memorySize));
}

// --- Control Flow Operations ---

function opStop(state: EvmState): void {
	state.stopped = true;
}

function opJump(state: EvmState): void {
	const dest = stackPop(state);
	const destNum = Number(dest);

	if (!state.validJumpDests.has(destNum)) {
		throw new InvalidJumpDestError(destNum);
	}

	state.pc = destNum - 1; // -1 because step() will increment
}

function opJumpi(state: EvmState): void {
	const dest = stackPop(state);
	const condition = stackPop(state);

	if (condition !== 0n) {
		const destNum = Number(dest);
		if (!state.validJumpDests.has(destNum)) {
			throw new InvalidJumpDestError(destNum);
		}
		state.pc = destNum - 1; // -1 because step() will increment
	}
}

function opJumpdest(_state: EvmState): void {
	// No-op marker for valid jump destinations
}

function opReturn(state: EvmState): void {
	const offset = stackPop(state);
	const size = stackPop(state);
	state.output = memoryRead(state, Number(offset), Number(size));
	state.stopped = true;
}

function opRevert(state: EvmState): void {
	const offset = stackPop(state);
	const size = stackPop(state);
	state.output = memoryRead(state, Number(offset), Number(size));
	state.stopped = true;
	state.reverted = true;
}

// --- Environment Operations ---

function opPc(state: EvmState): void {
	stackPush(state, BigInt(state.pc));
}

function opGas(state: EvmState): void {
	stackPush(state, state.gas);
}

function opCodesize(state: EvmState): void {
	stackPush(state, BigInt(state.bytecode.length));
}

function opCodecopy(state: EvmState): void {
	const destOffset = Number(stackPop(state));
	const offset = Number(stackPop(state));
	const size = Number(stackPop(state));

	expandMemory(state, destOffset, size);

	for (let i = 0; i < size; i++) {
		const byte = offset + i < state.bytecode.length ? state.bytecode[offset + i] : 0;
		state.memory.set(destOffset + i, byte);
	}
}

// ============================================================
// SECTION 4: EXECUTION ENGINE
// ============================================================

/**
 * Execute a single opcode
 *
 * Uses Voltaire's Opcode constants for dispatch and getGasCost() for metering.
 */
export function executeOpcode(state: EvmState, opcode: number): void {
	switch (opcode) {
		// Control flow
		case Opcode.STOP:
			opStop(state);
			break;
		case Opcode.JUMP:
			opJump(state);
			break;
		case Opcode.JUMPI:
			opJumpi(state);
			break;
		case Opcode.JUMPDEST:
			opJumpdest(state);
			break;
		case Opcode.RETURN:
			opReturn(state);
			break;
		case Opcode.REVERT:
			opRevert(state);
			break;

		// Arithmetic
		case Opcode.ADD:
			opAdd(state);
			break;
		case Opcode.MUL:
			opMul(state);
			break;
		case Opcode.SUB:
			opSub(state);
			break;
		case Opcode.DIV:
			opDiv(state);
			break;
		case Opcode.MOD:
			opMod(state);
			break;
		case Opcode.LT:
			opLt(state);
			break;
		case Opcode.GT:
			opGt(state);
			break;
		case Opcode.EQ:
			opEq(state);
			break;
		case Opcode.ISZERO:
			opIszero(state);
			break;

		// Bitwise
		case Opcode.NOT:
			opNot(state);
			break;
		case Opcode.AND:
			opAnd(state);
			break;
		case Opcode.OR:
			opOr(state);
			break;
		case Opcode.XOR:
			opXor(state);
			break;

		// Stack
		case Opcode.POP:
			opPop(state);
			break;

		// Memory
		case Opcode.MLOAD:
			opMload(state);
			break;
		case Opcode.MSTORE:
			opMstore(state);
			break;
		case Opcode.MSTORE8:
			opMstore8(state);
			break;
		case Opcode.MSIZE:
			opMsize(state);
			break;

		// Environment
		case Opcode.PC:
			opPc(state);
			break;
		case Opcode.GAS:
			opGas(state);
			break;
		case Opcode.CODESIZE:
			opCodesize(state);
			break;
		case Opcode.CODECOPY:
			opCodecopy(state);
			break;

		default:
			// Handle PUSH1-PUSH32 (0x60-0x7f)
			if (Opcode.isPush(opcode)) {
				const size = Opcode.getPushSize(opcode);
				if (size !== null) {
					opPush(state, size);
				} else {
					throw new InvalidOpcodeError(opcode);
				}
			}
			// Handle DUP1-DUP16 (0x80-0x8f)
			else if (Opcode.isDup(opcode)) {
				const position = Opcode.dupPosition(opcode);
				if (position !== null) {
					opDup(state, position);
				} else {
					throw new InvalidOpcodeError(opcode);
				}
			}
			// Handle SWAP1-SWAP16 (0x90-0x9f)
			else if (Opcode.isSwap(opcode)) {
				const position = Opcode.swapPosition(opcode);
				if (position !== null) {
					opSwap(state, position);
				} else {
					throw new InvalidOpcodeError(opcode);
				}
			} else {
				throw new InvalidOpcodeError(opcode);
			}
	}
}

/**
 * Execute a single step (one opcode)
 *
 * Consumes gas using Voltaire's Opcode.getGasCost(), then executes the opcode.
 */
export function step(state: EvmState): void {
	if (state.stopped || state.pc >= state.bytecode.length) {
		return;
	}

	const opcode = state.bytecode[state.pc];

	// Get gas cost from Voltaire's Opcode utilities
	const gasCost = Opcode.getGasCost(opcode);
	if (gasCost !== null) {
		consumeGas(state, BigInt(gasCost));
	}

	// Execute the opcode
	executeOpcode(state, opcode);

	// Advance program counter (unless JUMP/JUMPI/STOP modified it)
	if (!state.stopped) {
		state.pc++;
	}
}

/**
 * Execute bytecode until completion or error
 *
 * @param bytecodeHex - Hex string of bytecode (with or without 0x prefix)
 * @param gas - Initial gas limit (default: 100000)
 * @returns Execution result with output, gas used, and status
 */
export function execute(
	bytecodeHex: string,
	gas: bigint = 100000n,
): ExecutionResult {
	// Use Voltaire's Hex to parse bytecode
	const bytecode = Hex.toBytes(Hex.from(bytecodeHex));

	const state = createState(bytecode, gas);
	const initialGas = gas;

	try {
		let iterations = 0;
		const maxIterations = 10_000_000;

		while (!state.stopped && state.pc < state.bytecode.length) {
			iterations++;
			if (iterations > maxIterations) {
				throw new EvmError("Execution timeout (max iterations exceeded)");
			}
			step(state);
		}

		return {
			success: !state.reverted,
			output: state.output,
			gasUsed: initialGas - state.gas,
			gasRemaining: state.gas,
			finalStack: [...state.stack],
		};
	} catch (e) {
		return {
			success: false,
			output: state.output,
			gasUsed: initialGas - state.gas,
			gasRemaining: state.gas,
			error: e instanceof Error ? e.message : String(e),
			finalStack: [...state.stack],
		};
	}
}

// ============================================================
// SECTION 5: UTILITIES
// ============================================================

/**
 * Assemble bytecode from instruction mnemonics
 *
 * @example
 * assembleProgram(["PUSH1", "02", "PUSH1", "03", "ADD", "STOP"])
 * // Returns "0x60026003010000"
 */
export function assembleProgram(instructions: string[]): string {
	const bytes: number[] = [];

	for (let i = 0; i < instructions.length; i++) {
		const inst = instructions[i].toUpperCase();

		// Check if it's a raw hex byte
		if (/^[0-9A-F]{2}$/i.test(inst)) {
			bytes.push(parseInt(inst, 16));
			continue;
		}

		// Look up opcode by name
		const opcode = (Opcode as Record<string, unknown>)[inst];
		if (typeof opcode === "number") {
			bytes.push(opcode);
		} else {
			throw new Error(`Unknown instruction: ${inst}`);
		}
	}

	return "0x" + bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Trace execution step by step (for debugging)
 *
 * Uses Voltaire's Opcode.getName() to display opcode names.
 */
export function traceExecution(
	bytecodeHex: string,
	gas: bigint = 100000n,
): { steps: TraceStep[]; result: ExecutionResult } {
	const bytecode = Hex.toBytes(Hex.from(bytecodeHex));
	const state = createState(bytecode, gas);
	const initialGas = gas;
	const steps: TraceStep[] = [];

	try {
		let iterations = 0;
		const maxIterations = 10000;

		while (!state.stopped && state.pc < state.bytecode.length) {
			iterations++;
			if (iterations > maxIterations) break;

			const pc = state.pc;
			const opcode = state.bytecode[pc];
			const opcodeName = Opcode.getName(opcode) ?? `0x${opcode.toString(16)}`;
			const gasBefore = state.gas;
			const stackBefore = [...state.stack];

			step(state);

			steps.push({
				pc,
				opcode,
				opcodeName,
				gasCost: gasBefore - state.gas,
				gasRemaining: state.gas,
				stackBefore,
				stackAfter: [...state.stack],
			});
		}

		return {
			steps,
			result: {
				success: !state.reverted,
				output: state.output,
				gasUsed: initialGas - state.gas,
				gasRemaining: state.gas,
				finalStack: [...state.stack],
			},
		};
	} catch (e) {
		return {
			steps,
			result: {
				success: false,
				output: state.output,
				gasUsed: initialGas - state.gas,
				gasRemaining: state.gas,
				error: e instanceof Error ? e.message : String(e),
				finalStack: [...state.stack],
			},
		};
	}
}

export type TraceStep = {
	pc: number;
	opcode: number;
	opcodeName: string;
	gasCost: bigint;
	gasRemaining: bigint;
	stackBefore: bigint[];
	stackAfter: bigint[];
};

/**
 * Create a mock execution context with Voltaire Address types
 */
export function createContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
	return {
		caller: Address.from("0x0000000000000000000000000000000000000001"),
		origin: Address.from("0x0000000000000000000000000000000000000001"),
		address: Address.from("0x0000000000000000000000000000000000000002"),
		gasLimit: 100000n,
		...overrides,
	};
}

/**
 * Get information about an opcode using Voltaire utilities
 */
export function getOpcodeInfo(opcode: number): {
	name: string | null;
	gasCost: number | null;
	stackInput: number | null;
	stackOutput: number | null;
	description: string | null;
} {
	return {
		name: Opcode.getName(opcode),
		gasCost: Opcode.getGasCost(opcode),
		stackInput: Opcode.getStackInput(opcode),
		stackOutput: Opcode.getStackOutput(opcode),
		description: Opcode.getDescription(opcode),
	};
}
