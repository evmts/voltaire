import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as S from "effect/Schema";
import { fromArray } from "./AbiSchema.js";
import { decodeLog } from "./decodeLog.js";

const erc20Abi = S.decodeUnknownSync(fromArray)([
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ name: "from", type: "address", indexed: true },
			{ name: "to", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
]);

describe("decodeLog", () => {
	describe("error cases", () => {
		it("fails for unknown event", async () => {
			const exit = await Effect.runPromiseExit(
				decodeLog(erc20Abi, {
					data: new Uint8Array(32),
					topics: [new Uint8Array(32)],
				}),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});
});
