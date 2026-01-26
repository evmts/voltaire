import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
import {
	TransportError,
	TransportService,
} from "../Transport/TransportService.js";
import { simulateCalls } from "./simulateCalls.js";

const ERC20_TRANSFER_TOPIC =
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as const;

const padAddressTopic = (address: string) =>
	`0x${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}` as const;

const padUint256 = (value: bigint) =>
	`0x${value.toString(16).padStart(64, "0")}` as const;

describe("simulateCalls", () => {
	it("captures ERC20 and ETH asset changes", async () => {
		const account = "0x1111111111111111111111111111111111111111";
		const token = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
		const contract = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
		const recipient = "0x2222222222222222222222222222222222222222";
		const internalRecipient =
			"0x3333333333333333333333333333333333333333";

		const simulateResponse = [
			{
				calls: [
					{
						status: "0x1",
						returnData: "0x",
						gasUsed: "0x5208",
						logs: [
							{
								address: token,
								topics: [
									ERC20_TRANSFER_TOPIC,
									padAddressTopic(account),
									padAddressTopic(recipient),
								],
								data: padUint256(500n),
								blockNumber: "0x1",
								transactionHash: "0x".padEnd(66, "0"),
								transactionIndex: "0x0",
								blockHash: "0x".padEnd(66, "0"),
								logIndex: "0x0",
								removed: false,
							},
						],
					},
				],
			},
		];

		const traceResponse = {
			callTrace: {
				calls: [
					{
						from: contract,
						to: internalRecipient,
						value: "0x2",
					},
				],
			},
		};

		const transport = Layer.succeed(TransportService, {
			request: <T>(method: string) =>
				Effect.try({
					try: () => {
						if (method === "eth_simulateV1") return simulateResponse as T;
						if (method === "debug_traceCall") return traceResponse as T;
						throw new Error(`Unexpected method: ${method}`);
					},
					catch: (e) =>
						new TransportError({
							code: -32603,
							message: (e as Error).message,
						}),
				}),
		});

		const result = await Effect.runPromise(
			simulateCalls({
				account,
				calls: [{ to: contract, value: 1n }],
			}).pipe(Effect.provide(transport)),
		);

		expect(result).toHaveLength(1);
		const [first] = result;
		expect(first.success).toBe(true);
		expect(first.gasUsed).toBe(21000n);
		expect(first.returnData).toBe("0x");
		expect(first.logs).toHaveLength(1);

		expect(first.assetChanges).toHaveLength(3);

		const erc20Change = first.assetChanges.find(
			(change) => change.asset.toLowerCase() === token,
		);
		expect(erc20Change).toBeDefined();
		expect(erc20Change?.from).toBe(account);
		expect(erc20Change?.to).toBe(recipient);
		expect(erc20Change?.amount).toBe(500n);
		expect(erc20Change?.type).toBe("transfer");

		const ethTopLevel = first.assetChanges.find(
			(change) =>
				change.asset === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" &&
				change.to === contract,
		);
		expect(ethTopLevel?.from).toBe(account);
		expect(ethTopLevel?.amount).toBe(1n);
		expect(ethTopLevel?.type).toBe("transfer");

		const ethInternal = first.assetChanges.find(
			(change) =>
				change.asset === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" &&
				change.to === internalRecipient,
		);
		expect(ethInternal?.from).toBe(contract);
		expect(ethInternal?.amount).toBe(2n);
		expect(ethInternal?.type).toBe("transfer");
	});
});
