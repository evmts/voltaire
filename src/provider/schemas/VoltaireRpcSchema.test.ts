/**
 * Voltaire RPC Schema Type Tests
 *
 * These tests validate the type system at compile time.
 */

import { describe, expectTypeOf, it } from "vitest";
import type {
	RpcMethodNames,
	RpcMethodParameters,
	RpcMethodReturnType,
} from "../RpcSchema.js";
import type { VoltaireRpcSchema } from "./VoltaireRpcSchema.js";

describe("VoltaireRpcSchema type tests", () => {
	it("extracts method names correctly", () => {
		type Methods = RpcMethodNames<VoltaireRpcSchema>;

		// Should include eth methods
		expectTypeOf<"eth_blockNumber">().toMatchTypeOf<Methods>();
		expectTypeOf<"eth_call">().toMatchTypeOf<Methods>();
		expectTypeOf<"eth_getBalance">().toMatchTypeOf<Methods>();
		expectTypeOf<"eth_chainId">().toMatchTypeOf<Methods>();

		// Should include debug methods
		expectTypeOf<"debug_getRawBlock">().toMatchTypeOf<Methods>();

		// Should include engine methods
		expectTypeOf<"engine_newPayloadV1">().toMatchTypeOf<Methods>();

		// Should include anvil methods
		expectTypeOf<"anvil_impersonateAccount">().toMatchTypeOf<Methods>();
		expectTypeOf<"evm_mine">().toMatchTypeOf<Methods>();
	});

	it("extracts parameters correctly for eth_blockNumber", () => {
		type Params = RpcMethodParameters<VoltaireRpcSchema, "eth_blockNumber">;
		expectTypeOf<Params>().toEqualTypeOf<[]>();
	});

	it("extracts parameters correctly for eth_call", () => {
		type Params = RpcMethodParameters<VoltaireRpcSchema, "eth_call">;
		expectTypeOf<Params>().toMatchTypeOf<
			[
				{
					from?: string;
					to: string;
					gas?: string;
					gasPrice?: string;
					value?: string;
					data?: string;
				},
				string,
			]
		>();
	});

	it("extracts parameters correctly for eth_getBalance", () => {
		type Params = RpcMethodParameters<VoltaireRpcSchema, "eth_getBalance">;
		expectTypeOf<Params>().toEqualTypeOf<[string, string]>();
	});

	it("extracts return type correctly for eth_blockNumber", () => {
		type Return = RpcMethodReturnType<VoltaireRpcSchema, "eth_blockNumber">;
		expectTypeOf<Return>().toEqualTypeOf<string>();
	});

	it("extracts return type correctly for eth_call", () => {
		type Return = RpcMethodReturnType<VoltaireRpcSchema, "eth_call">;
		expectTypeOf<Return>().toEqualTypeOf<string>();
	});

	it("extracts return type correctly for eth_getBalance", () => {
		type Return = RpcMethodReturnType<VoltaireRpcSchema, "eth_getBalance">;
		expectTypeOf<Return>().toEqualTypeOf<string>();
	});

	it("extracts return type correctly for eth_accounts", () => {
		type Return = RpcMethodReturnType<VoltaireRpcSchema, "eth_accounts">;
		expectTypeOf<Return>().toEqualTypeOf<string[]>();
	});

	it("extracts return type correctly for eth_syncing", () => {
		type Return = RpcMethodReturnType<VoltaireRpcSchema, "eth_syncing">;
		expectTypeOf<Return>().toMatchTypeOf<
			| false
			| {
					startingBlock: string;
					currentBlock: string;
					highestBlock: string;
			  }
		>();
	});
});
