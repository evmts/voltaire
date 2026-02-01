import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as S from "effect/Schema";
import { fromArray } from "./AbiSchema.js";
import { decodeData } from "./decodeData.js";

const erc20Abi = S.decodeUnknownSync(fromArray)([
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
	},
]);

describe("decodeData", () => {
	describe("error cases", () => {
		it("fails for data too short", async () => {
			const exit = await Effect.runPromiseExit(
				decodeData(erc20Abi, new Uint8Array(2)),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails for unknown selector", async () => {
			const exit = await Effect.runPromiseExit(
				decodeData(erc20Abi, new Uint8Array(68)),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});
});
