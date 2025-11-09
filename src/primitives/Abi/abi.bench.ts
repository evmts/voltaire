/**
 * ABI Encoding/Decoding Benchmarks
 *
 * Measures performance of ABI operations
 */

import { Address } from "../Address/index.js";
import type { Item } from "./Item.js";
import type { BrandedError } from "./error/BrandedError.js";
import * as Abi from "./index.js";

// Helper to work around strict type checking in benchmarks
const encodeParams = Abi.encodeParameters as any;
const decodeParams = Abi.decodeParameters as any;

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
		try {
			fn();
		} catch {
			// Ignore errors during warmup (for not-implemented functions)
		}
	}

	// Benchmark
	const startTime = performance.now();
	let iterations = 0;
	let endTime = startTime;

	while (endTime - startTime < duration) {
		try {
			fn();
		} catch {
			// Count iteration even if it throws
		}
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

const transferFunc = {
	type: "function",
	name: "transfer",
	stateMutability: "nonpayable",
	inputs: [
		{ type: "address", name: "to" },
		{ type: "uint256", name: "amount" },
	],
	outputs: [{ type: "bool", name: "" }],
} as const satisfies Abi.Function.Function;

const balanceOfFunc = {
	type: "function",
	name: "balanceOf",
	stateMutability: "view",
	inputs: [{ type: "address", name: "account" }],
	outputs: [{ type: "uint256", name: "" }],
} as const satisfies Abi.Function.Function;

const complexFunc = {
	type: "function",
	name: "processOrder",
	stateMutability: "nonpayable",
	inputs: [
		{
			type: "tuple",
			name: "order",
			components: [
				{ type: "address", name: "maker" },
				{
					type: "tuple",
					name: "asset",
					components: [
						{ type: "address", name: "token" },
						{ type: "uint256", name: "amount" },
					],
				},
				{ type: "uint256[]", name: "fees" },
			],
		},
	],
	outputs: [],
} as const satisfies Abi.Function.Function;

const transferEvent = {
	type: "event",
	name: "Transfer",
	inputs: [
		{ type: "address", name: "from", indexed: true },
		{ type: "address", name: "to", indexed: true },
		{ type: "uint256", name: "value", indexed: false },
	],
} as const satisfies Abi.Event.Event;

const insufficientBalanceError = {
	type: "error",
	name: "InsufficientBalance",
	inputs: [
		{ type: "uint256", name: "available" },
		{ type: "uint256", name: "required" },
	],
} as const satisfies BrandedError;

const results: BenchmarkResult[] = [];
results.push(
	benchmark("Function.getSignature - simple", () =>
		Abi.Function.getSignature(transferFunc),
	),
);
results.push(
	benchmark("Function.getSignature - complex tuple", () =>
		Abi.Function.getSignature(complexFunc),
	),
);
results.push(
	benchmark("Event.getSignature", () => Abi.Event.getSignature(transferEvent)),
);
results.push(
	benchmark("Error.getSignature", () =>
		Abi.Error.getSignature(insufficientBalanceError),
	),
);
results.push(
	benchmark("Function.getSelector - transfer", () =>
		Abi.Function.getSelector(transferFunc),
	),
);
results.push(
	benchmark("Function.getSelector - balanceOf", () =>
		Abi.Function.getSelector(balanceOfFunc),
	),
);
results.push(
	benchmark("Event.getSelector - Transfer", () =>
		Abi.Event.getSelector(transferEvent),
	),
);
results.push(
	benchmark("Error.getSelector - InsufficientBalance", () =>
		Abi.Error.getSelector(insufficientBalanceError),
	),
);
results.push(
	benchmark("Abi.getFunctionSelector", () => {
		const func = {
			type: "function" as const,
			name: "transfer",
			stateMutability: "nonpayable" as const,
			inputs: [{ type: "address" }, { type: "uint256" }] as const,
			outputs: [] as const,
		};
		return Abi.Function.getSelector(func);
	}),
);
results.push(
	benchmark("Abi.getEventSelector", () => {
		const event = {
			type: "event" as const,
			name: "Transfer",
			inputs: [
				{ type: "address", indexed: true },
				{ type: "address", indexed: true },
				{ type: "uint256", indexed: false },
			] as const,
		};
		return Abi.Event.getSelector(event);
	}),
);
results.push(
	benchmark("Abi.getErrorSelector", () => {
		const error = {
			type: "error" as const,
			name: "InsufficientBalance",
			inputs: [{ type: "uint256" }, { type: "uint256" }] as const,
		};
		return Abi.Error.getSelector(error);
	}),
);
results.push(
	benchmark("formatAbiItem - function", () => Abi.Item.format(transferFunc)),
);
results.push(
	benchmark("formatAbiItem - event", () => Abi.Item.format(transferEvent)),
);
results.push(
	benchmark("formatAbiItem - error", () =>
		Abi.Item.format(insufficientBalanceError),
	),
);
results.push(
	benchmark("formatAbiItem - complex", () => Abi.Item.format(complexFunc)),
);
results.push(
	benchmark("formatAbiItemWithArgs - function", () =>
		Abi.Item.formatWithArgs(transferFunc, [
			"0x0000000000000000000000000000000000000000",
			100n,
		]),
	),
);
results.push(
	benchmark("formatAbiItemWithArgs - event", () =>
		Abi.Item.formatWithArgs(transferEvent, [
			"0x0000000000000000000000000000000000000000",
			"0x0000000000000000000000000000000000000000",
			1000n,
		]),
	),
);
results.push(
	benchmark("encode uint256", () => {
		encodeParams([{ type: "uint256" }], [42n]);
	}),
);
results.push(
	benchmark("encode address", () => {
		encodeParams(
			[{ type: "address" }],
			["0x0000000000000000000000000000000000000000"],
		);
	}),
);
results.push(
	benchmark("encode bool", () => {
		encodeParams([{ type: "bool" }], [true]);
	}),
);
results.push(
	benchmark("encode string", () => {
		encodeParams([{ type: "string" }], ["Hello World"]);
	}),
);
results.push(
	benchmark("encode (uint256, address, bool)", () => {
		encodeParams(
			[{ type: "uint256" }, { type: "address" }, { type: "bool" }],
			[123n, "0x0000000000000000000000000000000000000000", true],
		);
	}),
);
results.push(
	benchmark("encode (string, uint256, bool)", () => {
		encodeParams(
			[{ type: "string" }, { type: "uint256" }, { type: "bool" }],
			["test", 420n, true],
		);
	}),
);
const zeroAddr = Address.fromHex("0x0000000000000000000000000000000000000000");
results.push(
	benchmark("Function.encodeParams - transfer", () => {
		Abi.Function.encodeParams(transferFunc, [zeroAddr, 100n]);
	}),
);
results.push(
	benchmark("Function.encodeResult - bool", () => {
		Abi.Function.encodeResult(transferFunc, [true] as [boolean]);
	}),
);
results.push(
	benchmark("Event.encodeTopics", () => {
		Abi.Event.encodeTopics(transferEvent, {
			from: "0x0000000000000000000000000000000000000000",
		});
	}),
);
results.push(
	benchmark("Error.encodeParams", () => {
		Abi.Error.encodeParams(insufficientBalanceError, [100n, 200n] as [
			bigint,
			bigint,
		]);
	}),
);

const encodedUint256 = encodeParams([{ type: "uint256" }], [42n]);
const encodedAddress = encodeParams(
	[{ type: "address" }],
	["0x0000000000000000000000000000000000000000"],
);
const encodedBool = encodeParams([{ type: "bool" }], [true]);
const encodedString = encodeParams([{ type: "string" }], ["Hello World"]);
const encodedMixed = encodeParams(
	[{ type: "uint256" }, { type: "address" }],
	[123n, "0x0000000000000000000000000000000000000000"],
);
results.push(
	benchmark("decode uint256", () => {
		decodeParams([{ type: "uint256" }], encodedUint256);
	}),
);
results.push(
	benchmark("decode address", () => {
		decodeParams([{ type: "address" }], encodedAddress);
	}),
);
results.push(
	benchmark("decode bool", () => {
		decodeParams([{ type: "bool" }], encodedBool);
	}),
);
results.push(
	benchmark("decode string", () => {
		decodeParams([{ type: "string" }], encodedString);
	}),
);
results.push(
	benchmark("decode (uint256, address)", () => {
		decodeParams([{ type: "uint256" }, { type: "address" }], encodedMixed);
	}),
);
const encodedTransferCall = Abi.Function.encodeParams(transferFunc, [
	zeroAddr,
	100n,
]);
const encodedBoolResult = Abi.Function.encodeResult(transferFunc, [true] as [
	boolean,
]);

results.push(
	benchmark("Function.decodeParams", () => {
		Abi.Function.decodeParams(transferFunc, encodedTransferCall);
	}),
);
results.push(
	benchmark("Function.decodeResult", () => {
		Abi.Function.decodeResult(transferFunc, encodedBoolResult);
	}),
);
const encodedEventData = encodeParams([{ type: "uint256" }], [1000n]);
const eventTopics = Abi.Event.encodeTopics(transferEvent, {
	from: "0x0000000000000000000000000000000000000000",
	to: "0x0000000000000000000000000000000000000000",
});

results.push(
	benchmark("Event.decodeLog", () => {
		Abi.Event.decodeLog(transferEvent, encodedEventData, eventTopics as any);
	}),
);
const encodedError = Abi.Error.encodeParams(insufficientBalanceError, [
	100n,
	200n,
] as [bigint, bigint]);

results.push(
	benchmark("Error.decodeParams", () => {
		Abi.Error.decodeParams(insufficientBalanceError, encodedError);
	}),
);

// ============================================================================
// ABI-Level Operations
// ============================================================================

const testAbi = [
	transferFunc,
	balanceOfFunc,
] as const satisfies readonly Item[];
results.push(
	benchmark("Abi.getItem", () =>
		Abi.Item.getItem(testAbi, "transfer", "function"),
	),
);
results.push(
	benchmark("round-trip uint256", () => {
		const encoded = encodeParams([{ type: "uint256" }], [42n]);
		decodeParams([{ type: "uint256" }], encoded);
	}),
);
results.push(
	benchmark("round-trip (uint256, address)", () => {
		const params = [{ type: "uint256" }, { type: "address" }];
		const values = [123n, zeroAddr];
		const encoded = encodeParams(params, values as any);
		decodeParams(params, encoded);
	}),
);
results.push(
	benchmark("round-trip Function call", () => {
		const encoded = Abi.Function.encodeParams(transferFunc, [zeroAddr, 100n]);
		Abi.Function.decodeParams(transferFunc, encoded);
	}),
);

// Calculate statistics
const allOpsPerSec = results.map((r) => r.opsPerSec);
const avgOps = allOpsPerSec.reduce((a, b) => a + b, 0) / allOpsPerSec.length;
const maxOps = Math.max(...allOpsPerSec);
const minOps = Math.min(...allOpsPerSec);
const sortedResults = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
sortedResults.slice(0, 5).forEach((r, i) => {});

// Encoding vs Decoding comparison
const encodingOps = results
	.filter((r) => r.name.includes("encode"))
	.map((r) => r.opsPerSec);
const decodingOps = results
	.filter((r) => r.name.includes("decode"))
	.map((r) => r.opsPerSec);
if (encodingOps.length > 0 && decodingOps.length > 0) {
	const avgEncoding =
		encodingOps.reduce((a, b) => a + b, 0) / encodingOps.length;
	const avgDecoding =
		decodingOps.reduce((a, b) => a + b, 0) / decodingOps.length;
}

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/abi-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
}
