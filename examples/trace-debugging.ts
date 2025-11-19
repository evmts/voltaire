/**
 * Example: Using Execution Trace types to debug transaction failures
 *
 * This example demonstrates how to use Voltaire's trace types to:
 * 1. Configure trace execution with TraceConfig
 * 2. Parse trace results from debug_traceTransaction
 * 3. Analyze call trees to find failing calls
 * 4. Profile gas usage across operations
 */

import * as TraceConfig from "../src/primitives/TraceConfig/index.js";
import * as TraceResult from "../src/primitives/TraceResult/index.js";
import * as CallTrace from "../src/primitives/CallTrace/index.js";
import * as StructLog from "../src/primitives/StructLog/index.js";

// Example 1: Configure trace for debugging a revert
console.log("=== Example 1: Minimal config for debugging reverts ===\n");

const revertConfig = TraceConfig.from({
	disableStorage: true,
	disableMemory: true,
	enableReturnData: true,
});

console.log("TraceConfig:", revertConfig);
console.log(
	"This config disables heavy tracking (storage, memory) but keeps return data for revert reasons\n",
);

// Example 2: Configure callTracer for call tree analysis
console.log("=== Example 2: Using callTracer ===\n");

const callTracerConfig = TraceConfig.withTracer({}, "callTracer");
console.log("CallTracer config:", callTracerConfig);
console.log(
	"CallTracer provides a hierarchical call tree instead of opcode logs\n",
);

// Example 3: Analyze a trace result with structLogs
console.log("=== Example 3: Analyzing opcode trace ===\n");

const mockStructLogs = [
	StructLog.from({
		pc: 0,
		op: "PUSH1",
		gas: 1000000n as any,
		gasCost: 3n as any,
		depth: 0,
		stack: ["0x60"],
	}),
	StructLog.from({
		pc: 2,
		op: "PUSH1",
		gas: 999997n as any,
		gasCost: 3n as any,
		depth: 0,
		stack: ["0x60", "0x40"],
	}),
	StructLog.from({
		pc: 4,
		op: "MSTORE",
		gas: 999994n as any,
		gasCost: 6n as any,
		depth: 0,
		stack: [],
	}),
	StructLog.from({
		pc: 100,
		op: "REVERT",
		gas: 50000n as any,
		gasCost: 0n as any,
		depth: 0,
		stack: [],
		error: "execution reverted",
	}),
];

const traceResult = TraceResult.from({
	gas: 50000n as any,
	failed: true,
	returnValue: new Uint8Array(),
	structLogs: mockStructLogs,
});

console.log("Trace result:");
console.log(`  Gas used: ${traceResult.gas}`);
console.log(`  Failed: ${traceResult.failed}`);
console.log(
	`  Opcode steps: ${TraceResult.getStructLogs(traceResult).length}\n`,
);

// Find the revert
const logs = TraceResult.getStructLogs(traceResult);
const revert = logs.find((log) => log.op === "REVERT" || log.error);
if (revert) {
	console.log(`Found revert at PC ${revert.pc}:`);
	console.log(`  Opcode: ${revert.op}`);
	console.log(`  Error: ${revert.error}\n`);
}

// Calculate total gas used by opcode type
const gasByOpcode = new Map<string, bigint>();
for (const log of logs) {
	const current = gasByOpcode.get(log.op) ?? 0n;
	gasByOpcode.set(log.op, current + log.gasCost);
}

console.log("Gas usage by opcode:");
for (const [op, gas] of gasByOpcode) {
	console.log(`  ${op}: ${gas}`);
}
console.log();

// Example 4: Analyze call trace tree
console.log("=== Example 4: Call tree analysis ===\n");

const mockFromAddr = new Uint8Array(20).fill(1) as any;
const mockToAddr = new Uint8Array(20).fill(2) as any;
const mockContractAddr = new Uint8Array(20).fill(3) as any;

// Create nested call structure
const nestedCall = CallTrace.from({
	type: "STATICCALL",
	from: mockToAddr,
	to: mockContractAddr,
	gas: 20000n as any,
	gasUsed: 10000n as any,
	input: new Uint8Array(),
	output: new Uint8Array(),
});

const failedCall = CallTrace.from({
	type: "CALL",
	from: mockToAddr,
	to: mockContractAddr,
	gas: 50000n as any,
	gasUsed: 25000n as any,
	input: new Uint8Array(),
	output: new Uint8Array(),
	error: "execution reverted",
	revertReason: "ERC20: transfer amount exceeds balance",
});

const rootCall = CallTrace.from({
	type: "CALL",
	from: mockFromAddr,
	to: mockToAddr,
	gas: 100000n as any,
	gasUsed: 75000n as any,
	input: new Uint8Array(),
	output: new Uint8Array(),
	calls: [nestedCall, failedCall],
});

const callTraceResult = TraceResult.from({
	gas: 75000n as any,
	failed: true,
	returnValue: new Uint8Array(),
	callTrace: rootCall,
});

console.log("Call tree structure:");
console.log(`Root: ${rootCall.type} (${rootCall.gasUsed} gas)`);
console.log(`  Nested calls: ${CallTrace.getCalls(rootCall).length}\n`);

// Flatten to find all calls
const allCalls = CallTrace.flatten(rootCall);
console.log(`Total calls in tree: ${allCalls.length}\n`);

// Find failed calls
const failedCalls = allCalls.filter(CallTrace.hasError);
console.log(`Failed calls: ${failedCalls.length}`);
for (const call of failedCalls) {
	console.log(`  ${call.type} failed: ${call.error}`);
	if (call.revertReason) {
		console.log(`    Reason: ${call.revertReason}`);
	}
}
console.log();

// Gas profiling by call type
const gasByCallType = new Map<string, bigint>();
for (const call of allCalls) {
	const current = gasByCallType.get(call.type) ?? 0n;
	gasByCallType.set(call.type, current + call.gasUsed);
}

console.log("Gas usage by call type:");
for (const [type, gas] of gasByCallType) {
	console.log(`  ${type}: ${gas}`);
}
console.log();

// Example 5: Performance-optimized config
console.log("=== Example 5: Performance configurations ===\n");

const fastestConfig = TraceConfig.disableAll();
console.log("Fastest config (all tracking disabled):", fastestConfig);

const callTreeOnly = TraceConfig.withTracer(
	TraceConfig.disableAll(),
	"callTracer",
);
console.log("Call tree only (fast, good for debugging):", callTreeOnly, "\n");

console.log("✅ All trace type examples completed!");
