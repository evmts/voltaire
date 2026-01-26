import { Address, BrandedAbi } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { ProviderService } from "../Provider/index.js";
import { Contract } from "./Contract.js";

type HexType = `0x${string}`;

const testAddress = Address("0x6B175474E89094C44Da98b954EecdEfaE6E286AB");

const erc20Abi = [
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
] as const;

const mockProvider = {
	estimateGas: vi.fn(),
};

const MockProviderLayer = Layer.succeed(ProviderService, mockProvider as any);

describe("Contract.estimateGas", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("encodes data and calls provider.estimateGas", async () => {
		const recipient = Address("0x1234567890123456789012345678901234567890");
		const amount = 1000n;
		mockProvider.estimateGas.mockReturnValue(Effect.succeed(45000n));

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
		expect(mockProvider.estimateGas).toHaveBeenCalledTimes(1);

		const callArgs = mockProvider.estimateGas.mock.calls[0][0];
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
		mockProvider.estimateGas.mockReturnValue(Effect.succeed(21000n));

		const program = Effect.gen(function* () {
			const contract = yield* Contract(testAddress, erc20Abi);
			return yield* Contract.estimateGas(contract, "deposit", [{ value }]);
		});

		await Effect.runPromise(program.pipe(Effect.provide(MockProviderLayer)));

		const callArgs = mockProvider.estimateGas.mock.calls[0][0];
		const expectedData = BrandedAbi.encodeFunction(
			erc20Abi as unknown as BrandedAbi.Abi,
			"deposit",
			[],
		);

		expect(callArgs.data as HexType).toBe(expectedData as HexType);
		expect(callArgs.value).toBe(value);
	});

	it("maps provider errors to ContractCallError", async () => {
		const recipient = Address("0x1234567890123456789012345678901234567890");
		mockProvider.estimateGas.mockReturnValue(
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
