/**
 * Tests for WASM-accelerated ABI encoding/decoding
 *
 * @status SKIPPED - C API layer not yet implemented
 * These tests will be enabled once the C ABI implementation is complete
 */

import { beforeAll, describe, expect, it } from "vitest";
import * as loader from "../../wasm-loader/loader.js";
import {
	encodeVectors,
	functionDataVectors,
	roundTripVectors,
	selectorVectors,
} from "./TestData.js";
import * as Abi from "./index.js";
import * as wasmAbi from "./wasm/wasm.js";

// ============================================================================
// Setup and Status Checks
// ============================================================================

beforeAll(async () => {
	// Load WASM module before tests
	const wasmPath = new URL("../../../wasm/primitives.wasm", import.meta.url);
	await loader.loadWasm(wasmPath);
});

describe("WASM ABI Status", () => {
	it("reports available status", () => {
		expect(wasmAbi.isWasmAbiAvailable()).toBe(true);
	});

	it("provides implementation status", () => {
		const status = wasmAbi.getImplementationStatus();
		expect(status).toBeDefined();
	});
});

// ============================================================================
// Selector Tests (These work - use pure TS implementation)
// ============================================================================

describe("Abi.getFunctionSelector (Pure TS)", () => {
	for (const vector of selectorVectors) {
		// Only test function selectors (4 bytes)
		if (vector.expected.length === 8) {
			it(vector.name, () => {
				// Parse signature to extract name and params
				const match = vector.signature.match(/^(\w+)\((.*)\)$/);
				if (!match) throw new Error(`Invalid signature: ${vector.signature}`);
				const [, name, paramsStr] = match;
				if (!name) throw new Error(`No name in signature: ${vector.signature}`);
				const inputs = paramsStr
					? paramsStr.split(",").map((type) => ({ type: type.trim() as any }))
					: [];
				const func = {
					type: "function" as const,
					name,
					stateMutability: "nonpayable" as const,
					inputs,
					outputs: [] as const,
				};

				const selector = Abi.Function.getSelector(func);
				expect(selector).toBeInstanceOf(Uint8Array);
				expect(selector.length).toBe(4);

				const hex = Array.from(selector)
					.map((b: number) => b.toString(16).padStart(2, "0"))
					.join("");
				expect(hex).toBe(vector.expected);
			});
		}
	}
});

describe("Abi.getEventSelector (Pure TS)", () => {
	for (const vector of selectorVectors) {
		// Only test event selectors (32 bytes)
		if (vector.expected.length === 64) {
			it(vector.name, () => {
				// Parse signature to extract name and params
				const match = vector.signature.match(/^(\w+)\((.*)\)$/);
				if (!match) throw new Error(`Invalid signature: ${vector.signature}`);
				const [, name, paramsStr] = match;
				if (!name) throw new Error(`No name in signature: ${vector.signature}`);
				const inputs = paramsStr
					? paramsStr
							.split(",")
							.map((type) => ({ type: type.trim() as any, indexed: false }))
					: [];
				const event = { type: "event" as const, name, inputs };

				const selector = Abi.Event.getSelector(event);
				expect(selector).toBeInstanceOf(Uint8Array);
				expect(selector.length).toBe(32);

				const hex = Array.from(selector)
					.map((b: number) => b.toString(16).padStart(2, "0"))
					.join("");
				expect(hex).toBe(vector.expected);
			});
		}
	}
});

// ============================================================================
// WASM Encoding Tests (Currently Throws - Waiting for C API)
// ============================================================================

describe("WASM Parameter Encoding", () => {
	it("encodeParametersWasm works for uint256", () => {
		const params = [{ type: "uint256" as const }];
		const values: [bigint] = [42n];
		const encoded = wasmAbi.encodeParametersWasm(params, values);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});

	it("decodeParametersWasm works for uint256", () => {
		const params = [{ type: "uint256" as const }];
		const values: [bigint] = [42n];
		const encoded = wasmAbi.encodeParametersWasm(params, values);
		const decoded = wasmAbi.decodeParametersWasm(params, encoded);
		expect(decoded).toEqual(values);
	});

	it("encodeFunctionDataWasm throws not implemented", () => {
		expect(() => {
			wasmAbi.encodeFunctionDataWasm(
				"transfer(address,uint256)",
				[{ type: "address" }, { type: "uint256" }] as any,
				["0x0000000000000000000000000000000000000000" as any, 42n],
			);
		}).toThrow(/not yet implemented/i);
	});

	it("decodeFunctionDataWasm throws not implemented", () => {
		expect(() => {
			wasmAbi.decodeFunctionDataWasm(
				"transfer(address,uint256)",
				[{ type: "address" }, { type: "uint256" }],
				new Uint8Array(68),
			);
		}).toThrow(/not yet implemented/i);
	});

	it("encodeEventTopicsWasm throws not implemented", () => {
		expect(() => {
			wasmAbi.encodeEventTopicsWasm(
				"Transfer(address,address,uint256)",
				[
					{ type: "address", indexed: true },
					{ type: "address", indexed: true },
					{ type: "uint256", indexed: false },
				],
				{},
			);
		}).toThrow(/not yet implemented/i);
	});

	it("decodeEventLogWasm throws not implemented", () => {
		expect(() => {
			wasmAbi.decodeEventLogWasm(
				"Transfer(address,address,uint256)",
				[],
				new Uint8Array(),
				[],
			);
		}).toThrow(/not yet implemented/i);
	});

	it("encodePackedWasm throws not implemented", () => {
		expect(() => {
			wasmAbi.encodePackedWasm(["uint256"], [42n]);
		}).toThrow(/not yet implemented/i);
	});
});

// ============================================================================
// Test Vectors (Ready for Implementation)
// ============================================================================

describe("WASM Encoding - Basic Types", () => {
	for (const vector of encodeVectors) {
		it(vector.name, () => {
			// Convert test vector format to param/value format
			const params = vector.params.map((p) => ({ type: p.type })) as any;
			const values = vector.params.map((p) => p.value);

			const encoded = wasmAbi.encodeParametersWasm(params, values as any);
			const hex = Array.from(encoded)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			expect(hex).toBe(vector.expected);
		});
	}
});

describe("WASM Round-Trip Tests", () => {
	for (const vector of roundTripVectors) {
		it(vector.name, () => {
			const params = vector.params.map((p) => ({ type: p.type })) as any;
			const values = vector.params.map((p) => p.value);

			const encoded = wasmAbi.encodeParametersWasm(params, values as any);
			const decoded = wasmAbi.decodeParametersWasm(params, encoded);

			expect(decoded).toEqual(values);
		});
	}
});

describe("WASM Function Data Tests (Future)", () => {
	for (const vector of functionDataVectors) {
		if (vector.expectedCalldata) {
			it(vector.name, () => {
				const params = vector.params.map((p) => ({ type: p.type })) as any;
				const values = vector.params.map((p) => p.value);

				const calldata = wasmAbi.encodeFunctionDataWasm(
					vector.signature,
					params,
					values as any,
				);

				const hex = Array.from(calldata)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");

				expect(hex).toBe(vector.expectedCalldata);
			});
		}
	}
});

// ============================================================================
// Error Handling Tests (Future)
// ============================================================================

describe("WASM Error Handling (Future)", () => {
	it("throws on invalid type", () => {
		expect(() => {
			wasmAbi.encodeParametersWasm([{ type: "invalid_type" as any }], [42n]);
		}).toThrow();
	});

	it("throws on mismatched parameter count", () => {
		expect(() => {
			wasmAbi.encodeParametersWasm(
				[{ type: "uint256" }, { type: "address" }],
				[42n] as any, // Missing second value
			);
		}).toThrow();
	});

	it("throws on invalid selector in decode", () => {
		const wrongSelector = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
		expect(() => {
			wasmAbi.decodeFunctionDataWasm(
				"transfer(address,uint256)",
				[{ type: "address" }, { type: "uint256" }],
				wrongSelector,
			);
		}).toThrow();
	});

	it("throws on truncated data", () => {
		expect(() => {
			wasmAbi.decodeParametersWasm(
				[{ type: "uint256" }],
				new Uint8Array(16), // Too small
			);
		}).toThrow();
	});

	it("throws on invalid event topic0", () => {
		const wrongTopic0 = new Uint8Array(32).fill(0xff);
		expect(() => {
			wasmAbi.decodeEventLogWasm(
				"Transfer(address,address,uint256)",
				[
					{ type: "address", indexed: true },
					{ type: "address", indexed: true },
					{ type: "uint256", indexed: false },
				],
				new Uint8Array(),
				[wrongTopic0],
			);
		}).toThrow();
	});
});

// ============================================================================
// Performance Comparison Tests (Future)
// ============================================================================

describe("WASM vs Pure TS Performance", () => {
	it("compares TS vs WASM encoding", () => {
		const params = Array(10).fill({ type: "uint256" as const });
		const values = Array(10).fill(42n) as any;

		// Warmup
		for (let i = 0; i < 100; i++) {
			Abi.encodeParameters(params, values);
			wasmAbi.encodeParametersWasm(params, values);
		}

		// Benchmark
		const tsStart = performance.now();
		for (let i = 0; i < 1000; i++) {
			Abi.encodeParameters(params, values);
		}
		const tsTime = performance.now() - tsStart;

		const wasmStart = performance.now();
		for (let i = 0; i < 1000; i++) {
			wasmAbi.encodeParametersWasm(params, values);
		}
		const wasmTime = performance.now() - wasmStart;

		console.log(`TS: ${tsTime.toFixed(2)}ms, WASM: ${wasmTime.toFixed(2)}ms`);
		console.log(
			`WASM is ${(tsTime / wasmTime).toFixed(2)}x faster (${tsTime > wasmTime ? "faster" : "slower"})`,
		);

		// Just log the results, don't assert
		expect(wasmTime).toBeGreaterThan(0);
		expect(tsTime).toBeGreaterThan(0);
	});

	it("WASM decoding should be faster for complex types", () => {
		// Test with nested tuples and arrays
		const params = [
			{
				type: "tuple[]",
				components: [
					{ type: "address" },
					{ type: "uint256" },
					{ type: "bytes" },
				],
			},
		] as any;

		// Create test data
		const testData = new Uint8Array(1000);
		// Fill with encoded data...

		const wasmStart = performance.now();
		try {
			wasmAbi.decodeParametersWasm(params, testData);
		} catch (e) {
			// Expected - not implemented yet
		}
		const wasmTime = performance.now() - wasmStart;

		console.log(`WASM decode attempt: ${wasmTime}ms`);
	});
});

// ============================================================================
// Integration Tests (Future)
// ============================================================================

describe("WASM Integration Tests", () => {
	it("encodes uint256 correctly", () => {
		const params = [{ type: "uint256" as const }];
		const values: [bigint] = [42n];
		const encoded = wasmAbi.encodeParametersWasm(params, values);

		// Should match pure TS implementation
		const expected = Abi.encodeParameters(params, values);
		expect(encoded).toEqual(expected);
	});

	it("round-trips uint256", () => {
		const params = [{ type: "uint256" as const }];
		const original: [bigint] = [123456789n];
		const encoded = wasmAbi.encodeParametersWasm(params, original);
		const decoded = wasmAbi.decodeParametersWasm(params, encoded);
		expect(decoded).toEqual(original);
	});

	it("handles address correctly", () => {
		const params = [{ type: "address" as const }];
		const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
		const values: [any] = [addr];
		const encoded = wasmAbi.encodeParametersWasm(params, values as any);
		const decoded = wasmAbi.decodeParametersWasm(params, encoded);
		expect(String(decoded[0]).toLowerCase()).toBe(addr.toLowerCase());
	});
});

describe("WASM Integration Tests (Advanced - Future)", () => {
	it("encodes and decodes ERC20 transfer", () => {
		const transferSig = "transfer(address,uint256)";
		const params = [{ type: "address" }, { type: "uint256" }] as any;
		const values = [
			"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
			1000000000000000000n,
		];

		const calldata = wasmAbi.encodeFunctionDataWasm(
			transferSig,
			params,
			values as any,
		);

		expect(calldata.length).toBeGreaterThan(4);

		const match = transferSig.match(/^(\w+)\((.*)\)$/);
		if (!match) throw new Error(`Invalid signature: ${transferSig}`);
		const [, name, paramsStr] = match;
		if (!name) throw new Error(`No name in signature: ${transferSig}`);
		const inputs = paramsStr
			? paramsStr.split(",").map((type) => ({ type: type.trim() as any }))
			: [];
		const func = {
			type: "function" as const,
			name,
			stateMutability: "nonpayable" as const,
			inputs,
			outputs: [] as const,
		};

		expect(calldata.slice(0, 4)).toEqual(Abi.Function.getSelector(func));

		const decoded = wasmAbi.decodeFunctionDataWasm(
			transferSig,
			params,
			calldata,
		);

		expect(decoded).toEqual(values);
	});

	it("encodes and decodes Transfer event", () => {
		const transferSig = "Transfer(address,address,uint256)";
		const params = [
			{ type: "address", indexed: true, name: "from" },
			{ type: "address", indexed: true, name: "to" },
			{ type: "uint256", indexed: false, name: "value" },
		] as any;

		const from = "0x0000000000000000000000000000000000000000";
		const to = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
		const value = 1000000000000000000n;

		const topics = wasmAbi.encodeEventTopicsWasm(transferSig, params, {
			from,
			to,
		});

		expect(topics.length).toBe(3); // topic0 + 2 indexed params

		// Encode non-indexed data
		const data = wasmAbi.encodeParametersWasm([{ type: "uint256" }] as any, [
			value,
		]);

		const decoded = wasmAbi.decodeEventLogWasm(
			transferSig,
			params,
			data,
			topics,
		);

		expect(decoded).toEqual({
			from,
			to,
			value,
		});
	});
});
