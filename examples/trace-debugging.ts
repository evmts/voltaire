/**
 * Example: Using Execution Trace types to debug transaction failures
 *
 * This example demonstrates how to use Voltaire's trace types to:
 * 1. Configure trace execution with TraceConfig
 * 2. Parse trace results from debug_traceTransaction
 * 3. Analyze call trees to find failing calls
 * 4. Profile gas usage across operations
 */

import * as Address from "../src/primitives/Address/index.js";
import { Bytes } from "../src/primitives/Bytes/index.js";
import * as CallTrace from "../src/primitives/CallTrace/index.js";
import * as StructLog from "../src/primitives/StructLog/index.js";
import * as TraceConfig from "../src/primitives/TraceConfig/index.js";
import * as TraceResult from "../src/primitives/TraceResult/index.js";

const revertConfig = TraceConfig.from({
	disableStorage: true,
	disableMemory: true,
	enableReturnData: true,
});

const callTracerConfig = TraceConfig.withTracer({}, "callTracer");

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
	returnValue: Bytes.from([]),
	structLogs: mockStructLogs,
});

// Find the revert
const logs = TraceResult.getStructLogs(traceResult);
const revert = logs.find((log) => log.op === "REVERT" || log.error);
if (revert) {
}

// Calculate total gas used by opcode type
const gasByOpcode = new Map<string, bigint>();
for (const log of logs) {
	const current = gasByOpcode.get(log.op) ?? 0n;
	gasByOpcode.set(log.op, current + log.gasCost);
}
for (const [op, gas] of gasByOpcode) {
}

const mockFromAddr = Address.fromHex("0x0101010101010101010101010101010101010101");
const mockToAddr = Address.fromHex("0x0202020202020202020202020202020202020202");
const mockContractAddr = Address.fromHex("0x0303030303030303030303030303030303030303");

// Create nested call structure
const nestedCall = CallTrace.from({
	type: "STATICCALL",
	from: mockToAddr,
	to: mockContractAddr,
	gas: 20000n as any,
	gasUsed: 10000n as any,
	input: Bytes.from([]),
	output: Bytes.from([]),
});

const failedCall = CallTrace.from({
	type: "CALL",
	from: mockToAddr,
	to: mockContractAddr,
	gas: 50000n as any,
	gasUsed: 25000n as any,
	input: Bytes.from([]),
	output: Bytes.from([]),
	error: "execution reverted",
	revertReason: "ERC20: transfer amount exceeds balance",
});

const rootCall = CallTrace.from({
	type: "CALL",
	from: mockFromAddr,
	to: mockToAddr,
	gas: 100000n as any,
	gasUsed: 75000n as any,
	input: Bytes.from([]),
	output: Bytes.from([]),
	calls: [nestedCall, failedCall],
});

const callTraceResult = TraceResult.from({
	gas: 75000n as any,
	failed: true,
	returnValue: Bytes.from([]),
	callTrace: rootCall,
});

// Flatten to find all calls
const allCalls = CallTrace.flatten(rootCall);

// Find failed calls
const failedCalls = allCalls.filter(CallTrace.hasError);
for (const call of failedCalls) {
	if (call.revertReason) {
	}
}

// Gas profiling by call type
const gasByCallType = new Map<string, bigint>();
for (const call of allCalls) {
	const current = gasByCallType.get(call.type) ?? 0n;
	gasByCallType.set(call.type, current + call.gasUsed);
}
for (const [type, gas] of gasByCallType) {
}

const fastestConfig = TraceConfig.disableAll();

const callTreeOnly = TraceConfig.withTracer(
	TraceConfig.disableAll(),
	"callTracer",
);
