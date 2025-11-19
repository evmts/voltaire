/**
 * Tests for Rpc namespace - Request constructor API (EIP-1193 compliant)
 */

import { describe, expect, it } from "vitest";
import { Rpc } from "./index.js";

describe("Rpc.Eth Request Constructors", () => {
	it("creates GetBalanceRequest with default block param", () => {
		const request = Rpc.Eth.GetBalanceRequest(
			"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
		);

		expect(request).toEqual({
			method: "eth_getBalance",
			params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "latest"],
		});
	});

	it("creates GetBalanceRequest with custom block param", () => {
		const request = Rpc.Eth.GetBalanceRequest(
			"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			"0x1234",
		);

		expect(request).toEqual({
			method: "eth_getBalance",
			params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "0x1234"],
		});
	});

	it("creates CallRequest", () => {
		const request = Rpc.Eth.CallRequest(
			{
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				data: "0x12345678",
			},
			"latest",
		);

		expect(request).toEqual({
			method: "eth_call",
			params: [
				{
					to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
					data: "0x12345678",
				},
				"latest",
			],
		});
	});

	it("creates BlockNumberRequest with no params", () => {
		const request = Rpc.Eth.BlockNumberRequest();

		expect(request).toEqual({
			method: "eth_blockNumber",
		});
	});

	it("creates GetBlockByNumberRequest with default fullTransactions", () => {
		const request = Rpc.Eth.GetBlockByNumberRequest("0x1234");

		expect(request).toEqual({
			method: "eth_getBlockByNumber",
			params: ["0x1234", false],
		});
	});

	it("creates GetBlockByNumberRequest with fullTransactions true", () => {
		const request = Rpc.Eth.GetBlockByNumberRequest("0x1234", true);

		expect(request).toEqual({
			method: "eth_getBlockByNumber",
			params: ["0x1234", true],
		});
	});

	it("creates GetTransactionByHashRequest", () => {
		const request = Rpc.Eth.GetTransactionByHashRequest(
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		);

		expect(request).toEqual({
			method: "eth_getTransactionByHash",
			params: [
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			],
		});
	});

	it("creates SendRawTransactionRequest", () => {
		const request = Rpc.Eth.SendRawTransactionRequest("0xabcdef");

		expect(request).toEqual({
			method: "eth_sendRawTransaction",
			params: ["0xabcdef"],
		});
	});

	it("creates ChainIdRequest", () => {
		const request = Rpc.Eth.ChainIdRequest();

		expect(request).toEqual({
			method: "eth_chainId",
		});
	});

	it("returns RequestArguments structure {method, params?}", () => {
		const requestWithParams = Rpc.Eth.GetBalanceRequest(
			"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
		);
		const requestWithoutParams = Rpc.Eth.BlockNumberRequest();

		expect(requestWithParams).toHaveProperty("method");
		expect(requestWithParams).toHaveProperty("params");

		expect(requestWithoutParams).toHaveProperty("method");
		expect(requestWithoutParams).not.toHaveProperty("params");
	});
});
