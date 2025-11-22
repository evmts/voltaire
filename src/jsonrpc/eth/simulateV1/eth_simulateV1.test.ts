import { describe, test, expect } from "vitest";
import * as SimulateV1 from "./eth_simulateV1.js";

describe("eth_simulateV1", () => {
	describe("Method Name", () => {
		test("exports correct method name", () => {
			expect(SimulateV1.method).toBe("eth_simulateV1");
		});
	});

	describe("Request Construction", () => {
		test("creates request with minimal payload", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
								data: "0x70a08231000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request).toEqual({
				method: "eth_simulateV1",
				params: [payload],
			});
		});

		test("creates request with block overrides", () => {
			const payload = {
				blockStateCalls: [
					{
						blockOverrides: {
							number: "0x1",
							time: "0x64",
							baseFeePerGas: "0x7",
						},
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
								data: "0x70a08231",
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.method).toBe("eth_simulateV1");
			expect(request.params[0]).toEqual(payload);
		});

		test("creates request with state overrides", () => {
			const payload = {
				blockStateCalls: [
					{
						stateOverrides: {
							"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1": {
								balance: "0xde0b6b3a7640000",
								nonce: "0x5",
							},
						},
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.params[0].blockStateCalls[0].stateOverrides).toBeDefined();
		});

		test("creates request with validation flag", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
							},
						],
					},
				],
				validation: true,
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.params[0].validation).toBe(true);
		});

		test("creates request with traceTransfers flag", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
							},
						],
					},
				],
				traceTransfers: true,
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.params[0].traceTransfers).toBe(true);
		});

		test("creates request with returnFullTransactions flag", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
							},
						],
					},
				],
				returnFullTransactions: true,
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.params[0].returnFullTransactions).toBe(true);
		});

		test("creates request with multiple blocks", () => {
			const payload = {
				blockStateCalls: [
					{
						blockOverrides: { number: "0x1" },
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
							},
						],
					},
					{
						blockOverrides: { number: "0x2" },
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.params[0].blockStateCalls).toHaveLength(2);
		});

		test("creates request with EIP-1559 transaction", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								type: "0x2",
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
								maxFeePerGas: "0x3b9aca00",
								maxPriorityFeePerGas: "0x5f5e100",
								gas: "0x5208",
								value: "0x0",
								nonce: "0x0",
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.params[0].blockStateCalls[0].calls[0].type).toBe("0x2");
		});

		test("creates request with access list", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
								accessList: [
									{
										address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
										storageKeys: [
											"0x0000000000000000000000000000000000000000000000000000000000000001",
										],
									},
								],
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(
				request.params[0].blockStateCalls[0].calls[0].accessList,
			).toBeDefined();
		});

		test("creates request with state diff override", () => {
			const payload = {
				blockStateCalls: [
					{
						stateOverrides: {
							"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1": {
								stateDiff: {
									"0x0000000000000000000000000000000000000000000000000000000000000001":
										"0x0000000000000000000000000000000000000000000000000000000000000005",
								},
							},
						},
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(
				request.params[0].blockStateCalls[0].stateOverrides?.[
					"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
				]?.stateDiff,
			).toBeDefined();
		});
	});

	describe("Request Validation", () => {
		test("accepts valid minimal request", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
							},
						],
					},
				],
			};

			expect(() => SimulateV1.SimulateV1Request(payload)).not.toThrow();
		});

		test("accepts empty calls array", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [],
					},
				],
			};

			expect(() => SimulateV1.SimulateV1Request(payload)).not.toThrow();
		});

		test("accepts multiple calls in single block", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
							},
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
							},
						],
					},
				],
			};

			expect(() => SimulateV1.SimulateV1Request(payload)).not.toThrow();
		});

		test("accepts blob transaction parameters", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								type: "0x3",
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
								maxFeePerBlobGas: "0x3b9aca00",
								blobVersionedHashes: [
									"0x0100000000000000000000000000000000000000000000000000000000000000",
								],
							},
						],
					},
				],
			};

			expect(() => SimulateV1.SimulateV1Request(payload)).not.toThrow();
		});

		test("accepts withdrawals in block overrides", () => {
			const payload = {
				blockStateCalls: [
					{
						blockOverrides: {
							withdrawals: [
								{
									index: "0x0",
									validatorIndex: "0x1",
									address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
									amount: "0x5",
								},
							],
						},
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
							},
						],
					},
				],
			};

			expect(() => SimulateV1.SimulateV1Request(payload)).not.toThrow();
		});
	});

	describe("Response Structure", () => {
		test("result type is defined", () => {
			expect(SimulateV1.method).toBe("eth_simulateV1");
		});
	});

	describe("Complex Scenarios", () => {
		test("handles contract deployment simulation", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: null,
								input: "0x608060405234801561001057600080fd5b50",
								gas: "0x100000",
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.params[0].blockStateCalls[0].calls[0].to).toBeNull();
		});

		test("handles sequential dependent transactions", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
								input: "0xa9059cbb",
								value: "0x0",
							},
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
								input: "0x70a08231",
								value: "0x0",
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.params[0].blockStateCalls[0].calls).toHaveLength(2);
		});

		test("handles full state override with code replacement", () => {
			const payload = {
				blockStateCalls: [
					{
						stateOverrides: {
							"0xdAC17F958D2ee523a2206206994597C13D831ec7": {
								code: "0x608060405234801561001057600080fd5b50",
								state: {
									"0x0000000000000000000000000000000000000000000000000000000000000001":
										"0x0000000000000000000000000000000000000000000000000000000000000005",
								},
								balance: "0xde0b6b3a7640000",
								nonce: "0x1",
							},
						},
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(
				request.params[0].blockStateCalls[0].stateOverrides?.[
					"0xdAC17F958D2ee523a2206206994597C13D831ec7"
				]?.code,
			).toBeDefined();
		});

		test("handles multi-block simulation with increasing block numbers", () => {
			const payload = {
				blockStateCalls: [
					{
						blockOverrides: {
							number: "0x1000000",
							time: "0x64000000",
						},
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
							},
						],
					},
					{
						blockOverrides: {
							number: "0x1000001",
							time: "0x64000001",
						},
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.params[0].blockStateCalls).toHaveLength(2);
			expect(request.params[0].blockStateCalls[0].blockOverrides?.number).toBe(
				"0x1000000",
			);
			expect(request.params[0].blockStateCalls[1].blockOverrides?.number).toBe(
				"0x1000001",
			);
		});
	});

	describe("Edge Cases", () => {
		test("handles empty blockStateCalls array", () => {
			const payload = {
				blockStateCalls: [],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.params[0].blockStateCalls).toEqual([]);
		});

		test("handles zero values", () => {
			const payload = {
				blockStateCalls: [
					{
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
								to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
								value: "0x0",
								gas: "0x0",
							},
						],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(request.params[0].blockStateCalls[0].calls[0].value).toBe("0x0");
		});

		test("handles maximum withdrawal count", () => {
			const withdrawals = Array.from({ length: 16 }, (_, i) => ({
				index: `0x${i.toString(16)}`,
				validatorIndex: `0x${i.toString(16)}`,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
				amount: "0x1",
			}));

			const payload = {
				blockStateCalls: [
					{
						blockOverrides: {
							withdrawals,
						},
						calls: [],
					},
				],
			};

			const request = SimulateV1.SimulateV1Request(payload);

			expect(
				request.params[0].blockStateCalls[0].blockOverrides?.withdrawals,
			).toHaveLength(16);
		});
	});
});
