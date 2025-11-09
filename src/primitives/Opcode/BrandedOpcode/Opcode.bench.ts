/**
 * EVM Opcode Performance Benchmarks
 *
 * Measures performance of opcode operations
 */

import * as Opcode from "../Opcode.js";

// Benchmark runner
interface BenchmarkResult {
	name: string;
	opsPerSec: number;
	avgTimeMs: number;
	iterations: number;
}

function benchmark(
	name: string,
	fn: () => void,
	duration = 2000,
): BenchmarkResult {
	// Warmup
	for (let i = 0; i < 100; i++) {
		fn();
	}

	// Benchmark
	const startTime = performance.now();
	let iterations = 0;
	let endTime = startTime;

	while (endTime - startTime < duration) {
		fn();
		iterations++;
		endTime = performance.now();
	}

	const totalTime = endTime - startTime;
	const avgTimeMs = totalTime / iterations;
	const opsPerSec = (iterations / totalTime) * 1000;

	return {
		name,
		opsPerSec,
		avgTimeMs,
		iterations,
	};
}

// ============================================================================
// Test Data
// ============================================================================

const simpleBytecode = new Uint8Array([
	0x60,
	0x01, // PUSH1 0x01
	0x60,
	0x02, // PUSH1 0x02
	0x01, // ADD
]);

const complexBytecode = new Uint8Array([
	0x60,
	0x80, // PUSH1 0x80
	0x60,
	0x40, // PUSH1 0x40
	0x52, // MSTORE
	0x7f,
	...new Array(32).fill(0xff), // PUSH32
	0x60,
	0x00, // PUSH1 0x00
	0x52, // MSTORE
	0x5b, // JUMPDEST
	0x60,
	0x01, // PUSH1 0x01
	0x80, // DUP1
	0x90, // SWAP1
	0x50, // POP
	0xa0, // LOG0
]);

const jumpBytecode = new Uint8Array([
	0x5b, // JUMPDEST
	0x60,
	0x05, // PUSH1 0x05
	0x56, // JUMP (invalid, but for parsing)
	0x5b, // JUMPDEST
	0x00, // STOP
]);

const results: BenchmarkResult[] = [];
results.push(benchmark("getInfo - ADD", () => Opcode.info(Opcode.ADD)));
results.push(benchmark("getInfo - PUSH1", () => Opcode.info(Opcode.PUSH1)));
results.push(benchmark("getInfo - CALL", () => Opcode.info(Opcode.CALL)));
results.push(benchmark("getInfo - invalid", () => Opcode.info(0x0c as any)));
results.push(
	benchmark("info.call - ADD", () => {
		const op = Opcode.ADD;
		Opcode.info(op);
	}),
);
results.push(benchmark("getName - ADD", () => Opcode.name(Opcode.ADD)));
results.push(benchmark("getName - invalid", () => Opcode.name(0x0c as any)));
results.push(
	benchmark("name.call - ADD", () => {
		const op = Opcode.ADD;
		Opcode.name(op);
	}),
);
results.push(benchmark("isValid - valid opcode", () => Opcode.isValid(0x01)));
results.push(benchmark("isValid - invalid opcode", () => Opcode.isValid(0x0c)));
results.push(benchmark("valid.call - valid", () => Opcode.isValid(0x01)));
results.push(benchmark("isPush - PUSH1", () => Opcode.isPush(Opcode.PUSH1)));
results.push(benchmark("isPush - ADD", () => Opcode.isPush(Opcode.ADD)));
results.push(benchmark("isDup - DUP1", () => Opcode.isDup(Opcode.DUP1)));
results.push(benchmark("isSwap - SWAP1", () => Opcode.isSwap(Opcode.SWAP1)));
results.push(benchmark("isLog - LOG1", () => Opcode.isLog(Opcode.LOG1)));
results.push(
	benchmark("isTerminating - RETURN", () =>
		Opcode.isTerminating(Opcode.RETURN),
	),
);
results.push(benchmark("isJump - JUMP", () => Opcode.isJump(Opcode.JUMP)));
results.push(
	benchmark("isPush - PUSH1", () => {
		const op = Opcode.PUSH1;
		Opcode.isPush(op);
	}),
);
results.push(
	benchmark("isDup - DUP1", () => {
		const op = Opcode.DUP1;
		Opcode.isDup(op);
	}),
);
results.push(
	benchmark("getPushBytes - PUSH1", () => Opcode.pushBytes(Opcode.PUSH1)),
);
results.push(
	benchmark("getPushBytes - PUSH32", () => Opcode.pushBytes(Opcode.PUSH32)),
);
results.push(
	benchmark("getPushBytes - ADD", () => Opcode.pushBytes(Opcode.ADD)),
);
results.push(benchmark("getPushOpcode - 1", () => Opcode.pushOpcode(1)));
results.push(benchmark("getPushOpcode - 32", () => Opcode.pushOpcode(32)));
results.push(
	benchmark("pushBytes.call - PUSH1", () => {
		const op = Opcode.PUSH1;
		Opcode.pushBytes(op);
	}),
);
results.push(
	benchmark("pushOpcode.call - 1", () => {
		Opcode.pushOpcode(1);
	}),
);
results.push(
	benchmark("getDupPosition - DUP1", () => Opcode.dupPosition(Opcode.DUP1)),
);
results.push(
	benchmark("getDupPosition - DUP16", () => Opcode.dupPosition(Opcode.DUP16)),
);
results.push(
	benchmark("getSwapPosition - SWAP1", () => Opcode.swapPosition(Opcode.SWAP1)),
);
results.push(
	benchmark("getSwapPosition - SWAP16", () =>
		Opcode.swapPosition(Opcode.SWAP16),
	),
);
results.push(
	benchmark("getLogTopics - LOG1", () => Opcode.logTopics(Opcode.LOG1)),
);
results.push(
	benchmark("getLogTopics - LOG4", () => Opcode.logTopics(Opcode.LOG4)),
);
results.push(
	benchmark("dupPosition.call - DUP1", () => {
		const op = Opcode.DUP1;
		Opcode.dupPosition(op);
	}),
);
results.push(
	benchmark("swapPosition.call - SWAP1", () => {
		const op = Opcode.SWAP1;
		Opcode.swapPosition(op);
	}),
);
results.push(
	benchmark("logTopics.call - LOG1", () => {
		const op = Opcode.LOG1;
		Opcode.logTopics(op);
	}),
);
results.push(
	benchmark("parseBytecode - simple (5 bytes)", () =>
		Opcode.parse(simpleBytecode),
	),
);
results.push(
	benchmark("parseBytecode - complex (46 bytes)", () =>
		Opcode.parse(complexBytecode),
	),
);
results.push(
	benchmark("parseBytecode - jump (5 bytes)", () => Opcode.parse(jumpBytecode)),
);
results.push(
	benchmark("parse.call - simple", () => {
		Opcode.parse(simpleBytecode);
	}),
);

const simpleInst: Opcode.Instruction = {
	offset: 0,
	opcode: Opcode.ADD,
};

const pushInst: Opcode.Instruction = {
	offset: 10,
	opcode: Opcode.PUSH1,
	immediate: new Uint8Array([0x42]),
};

const push32Inst: Opcode.Instruction = {
	offset: 0,
	opcode: Opcode.PUSH32,
	immediate: new Uint8Array(32).fill(0xff),
};
results.push(
	benchmark("formatInstruction - simple", () => Opcode.format(simpleInst)),
);
results.push(
	benchmark("formatInstruction - PUSH1", () => Opcode.format(pushInst)),
);
results.push(
	benchmark("formatInstruction - PUSH32", () => Opcode.format(push32Inst)),
);
results.push(
	benchmark("format.call - simple", () => {
		Opcode.format(simpleInst);
	}),
);
results.push(
	benchmark("disassemble - simple", () => Opcode.disassemble(simpleBytecode)),
);
results.push(
	benchmark("disassemble - complex", () => Opcode.disassemble(complexBytecode)),
);
results.push(
	benchmark("findJumpDests - jump bytecode", () =>
		Opcode.jumpDests(jumpBytecode),
	),
);
results.push(
	benchmark("findJumpDests - complex", () => Opcode.jumpDests(complexBytecode)),
);
results.push(
	benchmark("isValidJumpDest", () => Opcode.isValidJumpDest(jumpBytecode, 0)),
);
results.push(
	benchmark("jumpDests.call", () => {
		Opcode.jumpDests(jumpBytecode);
	}),
);
results.push(
	benchmark("validJumpDest.call", () => {
		Opcode.isValidJumpDest(jumpBytecode, 0);
	}),
);
results.push(
	benchmark("Gas cost - simple sequence", () => {
		const instructions = Opcode.parse(simpleBytecode);
		let totalGas = 0;
		for (const inst of instructions) {
			const info = Opcode.info(inst.opcode);
			if (info) {
				totalGas += info.gasCost;
			}
		}
	}),
);

results.push(
	benchmark("Gas cost - complex sequence", () => {
		const instructions = Opcode.parse(complexBytecode);
		let totalGas = 0;
		for (const inst of instructions) {
			const info = Opcode.info(inst.opcode);
			if (info) {
				totalGas += info.gasCost;
			}
		}
	}),
);
results.push(
	benchmark("Stack analysis - simple sequence", () => {
		const instructions = Opcode.parse(simpleBytecode);
		let stackSize = 0;
		for (const inst of instructions) {
			const info = Opcode.info(inst.opcode);
			if (info) {
				stackSize = stackSize - info.stackInputs + info.stackOutputs;
			}
		}
	}),
);

results.push(
	benchmark("Stack analysis - complex sequence", () => {
		const instructions = Opcode.parse(complexBytecode);
		let stackSize = 0;
		for (const inst of instructions) {
			const info = Opcode.info(inst.opcode);
			if (info) {
				stackSize = stackSize - info.stackInputs + info.stackOutputs;
			}
		}
	}),
);

const fastest = results.reduce((prev, curr) =>
	prev.opsPerSec > curr.opsPerSec ? prev : curr,
);
const slowest = results.reduce((prev, curr) =>
	prev.opsPerSec < curr.opsPerSec ? prev : curr,
);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/opcode-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
}
