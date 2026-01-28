// @ts-nocheck - TODO: Fix ABI type inference issues
import { beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { Address, BrandedAbi } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as S from "effect/Schema";
import { fromArray } from "../../primitives/Abi/AbiSchema.js";
import { ProviderService } from "../Provider/index.js";
import { Contract } from "./Contract.js";

type HexType = `0x${string}`;

const testAddress = Address("0x6B175474E89094C44Da98b954EecdEfaE6E286AB");

const erc20Abi = S.decodeUnknownSync(fromArray)([
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "success", type: "bool" }],
	},
	{
		type: "function",
		name: "deposit",
		stateMutability: "payable",
		inputs: [],
		outputs: [],
	},
]);

const mockEstimateGasFn = vi.fn();

const mockProvider = {
	request: <T>(method: string, params?: unknown[]) => {
		switch (method) {
			case "eth_estimateGas":
				return mockEstimateGasFn(params?.[0]) as Effect.Effect<T, never>;
			case "eth_chainId":
				return Effect.succeed("0x1" as T);
			default:
				return Effect.succeed(null as T);
		}
	},
};

const MockProviderLayer = Layer.succeed(ProviderService, mockProvider as any);

describe("Contract.estimateGas", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("encodes data and calls estimateGas", async () => {
		const recipient = Address("0x1234567890123456789012345678901234567890");
		const amount = 1000n;
		mockEstimateGasFn.mockReturnValue(Effect.succeed("0xafc8")); // 45000 in hex

		const program = Effect.gen(function* () {
			const contract = yield* Contract(testAddress, erc20Abi);
			return yield* Contract.estimateGas(contract, "transfer", [
				recipient,
				amount,
			]);
		});

		const gas = await Effect.runPromise(
			program.pipe(Effect.provide(MockProviderLayer)),
		);

		expect(gas).toBe(45000n);
		expect(mockEstimateGasFn).toHaveBeenCalledTimes(1);

		const callArgs = mockEstimateGasFn.mock.calls[0][0];
		const expectedData = BrandedAbi.encodeFunction(
			erc20Abi as unknown as BrandedAbi.Abi,
			"transfer",
			[recipient, amount],
		);

		expect(callArgs.to).toBe(Address.toHex(testAddress));
		expect(callArgs.data as HexType).toBe(expectedData as HexType);
	});

	it("passes value for payable methods", async () => {
		const value = 1000000000000000000n;
		mockEstimateGasFn.mockReturnValue(Effect.succeed("0x5208")); // hex response from RPC

		const program = Effect.gen(function* () {
			const contract = yield* Contract(testAddress, erc20Abi);
			return yield* Contract.estimateGas(contract, "deposit", [{ value }]);
		});

		await Effect.runPromise(program.pipe(Effect.provide(MockProviderLayer)));

		const callArgs = mockEstimateGasFn.mock.calls[0][0];
		const expectedData = BrandedAbi.encodeFunction(
			erc20Abi as unknown as BrandedAbi.Abi,
			"deposit",
			[],
		);

		expect(callArgs.data as HexType).toBe(expectedData as HexType);
		// Value is hex-encoded for RPC
		expect(callArgs.value).toBe(`0x${value.toString(16)}`);
	});

	it("maps provider errors to ContractCallError", async () => {
		const recipient = Address("0x1234567890123456789012345678901234567890");
		mockEstimateGasFn.mockReturnValue(
			Effect.fail(new Error("estimate failed")),
		);

		const program = Effect.gen(function* () {
			const contract = yield* Contract(testAddress, erc20Abi);
			return yield* Contract.estimateGas(contract, "transfer", [
				recipient,
				1000n,
			]);
		}).pipe(
			Effect.catchTag("ContractCallError", (e) =>
				Effect.succeed(`caught: ${e.message}`),
			),
		);

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(MockProviderLayer)),
		);

		expect(result).toContain("caught:");
		expect(result).toContain("estimate failed");
	});
});
