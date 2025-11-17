/**
 * Tests for Rpc namespace - Request constructor API
 */

import { describe, expect, it } from "vitest";
import { Rpc } from "./index.js";

describe("Rpc.Eth Request Constructors", () => {
	it("creates GetBalanceRequest with default block param", () => {
		const request = Rpc.Eth.GetBalanceRequest(
			"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
		);

		expect(request).toEqual({
			jsonrpc: "2.0",
			method: "eth_getBalance",
			params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "latest"],
			id: null,
			__brand: "JsonRpcRequest",
		});
	});

	it("creates GetBalanceRequest with custom block param", () => {
		const request = Rpc.Eth.GetBalanceRequest(
			"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			"0x1234",
		);

		expect(request).toEqual({
			jsonrpc: "2.0",
			method: "eth_getBalance",
			params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "0x1234"],
			id: null,
			__brand: "JsonRpcRequest",
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
			jsonrpc: "2.0",
			method: "eth_call",
			params: [
				{
					to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
					data: "0x12345678",
				},
				"latest",
			],
			id: null,
			__brand: "JsonRpcRequest",
		});
	});

	it("creates BlockNumberRequest with no params", () => {
		const request = Rpc.Eth.BlockNumberRequest();

		expect(request).toEqual({
			jsonrpc: "2.0",
			method: "eth_blockNumber",
			params: [],
			id: null,
			__brand: "JsonRpcRequest",
		});
	});

	it("creates GetBlockByNumberRequest with default fullTransactions", () => {
		const request = Rpc.Eth.GetBlockByNumberRequest("0x1234");

		expect(request).toEqual({
			jsonrpc: "2.0",
			method: "eth_getBlockByNumber",
			params: ["0x1234", false],
			id: null,
			__brand: "JsonRpcRequest",
		});
	});

	it("creates GetBlockByNumberRequest with fullTransactions true", () => {
		const request = Rpc.Eth.GetBlockByNumberRequest("0x1234", true);

		expect(request).toEqual({
			jsonrpc: "2.0",
			method: "eth_getBlockByNumber",
			params: ["0x1234", true],
			id: null,
			__brand: "JsonRpcRequest",
		});
	});

	it("creates request with custom id", () => {
		const request = Rpc.Eth.BlockNumberRequest(123);

		expect(request).toEqual({
			jsonrpc: "2.0",
			method: "eth_blockNumber",
			params: [],
			id: 123,
			__brand: "JsonRpcRequest",
		});
	});

	it("creates GetTransactionByHashRequest", () => {
		const request = Rpc.Eth.GetTransactionByHashRequest(
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		);

		expect(request).toEqual({
			jsonrpc: "2.0",
			method: "eth_getTransactionByHash",
			params: [
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			],
			id: null,
			__brand: "JsonRpcRequest",
		});
	});

	it("creates SendRawTransactionRequest", () => {
		const request = Rpc.Eth.SendRawTransactionRequest("0xabcdef");

		expect(request).toEqual({
			jsonrpc: "2.0",
			method: "eth_sendRawTransaction",
			params: ["0xabcdef"],
			id: null,
			__brand: "JsonRpcRequest",
		});
	});

	it("creates ChainIdRequest", () => {
		const request = Rpc.Eth.ChainIdRequest();

		expect(request).toEqual({
			jsonrpc: "2.0",
			method: "eth_chainId",
			params: [],
			id: null,
			__brand: "JsonRpcRequest",
		});
	});
});
